// Thin fetch wrapper for talking to the Express API.
//
// - Sends/receives httpOnly cookies (accessToken/refreshToken) via
//   credentials: 'include', matching the server's cookie-based auth.
// - Bodies can be a plain object (sent as JSON) or a FormData instance
//   (sent as-is, so multipart uploads with images work) - Content-Type
//   is only ever set for the JSON case, letting the browser set the
//   multipart boundary itself.
// - On a 401 with code ACCESS_TOKEN_EXPIRED or ACCESS_TOKEN_MISSING (the
//   accessToken cookie's own maxAge lapsed and the browser dropped it
//   before this request), transparently calls /auth/refresh-token and
//   retries the original request once. Concurrent requests that hit this
//   at the same time share a single refresh call.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Paths that must never trigger the refresh flow, or we'd loop.
const AUTH_EXEMPT_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh-token"]);

let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new ApiError("Session expired", { status: res.status, code: "REFRESH_FAILED" });
        }
        return res;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const buildUrl = (path, query) => {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
  );

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
};

const parseResponseBody = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  try {
    return await res.json();
  } catch {
    return null;
  }
};

async function performRequest(path, { method = "GET", body, query, headers, signal } = {}) {
  const isFormData = body instanceof FormData;

  const finalHeaders = { Accept: "application/json", ...headers };
  if (body !== undefined && !isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    credentials: "include",
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    signal,
  });

  const payload = await parseResponseBody(res);

  return { res, payload };
}

async function request(path, options = {}) {
  const normalizedPath = path.startsWith("http")
    ? path
    : path.startsWith("/")
      ? path
      : `/${path}`;
  const isAuthExempt = [...AUTH_EXEMPT_PATHS].some((exempt) => normalizedPath.startsWith(exempt));

  let { res, payload } = await performRequest(path, options);

  // ACCESS_TOKEN_MISSING happens whenever the accessToken cookie's own
  // maxAge (15m, matching the JWT's expiresIn) lapses and the browser
  // deletes it before the next request goes out - the server then never
  // even sees a token to call "expired". That's a routine, expected
  // occurrence for any session older than 15 minutes, not a real auth
  // failure, so it gets the same silent-refresh treatment as
  // ACCESS_TOKEN_EXPIRED rather than failing the request outright.
  const isRecoverableAuthFailure =
    payload?.code === "ACCESS_TOKEN_EXPIRED" || payload?.code === "ACCESS_TOKEN_MISSING";

  if (!res.ok && res.status === 401 && isRecoverableAuthFailure && !isAuthExempt) {
    try {
      await refreshAccessToken();
    } catch {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      throw new ApiError("Session expired", { status: 401, code: "SESSION_EXPIRED" });
    }

    ({ res, payload } = await performRequest(path, options));
  }

  if (!res.ok) {
    if (res.status === 401 && payload?.code === "REFRESH_TOKEN_REUSED") {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }

    throw new ApiError(payload?.message || res.statusText || "Request failed", {
      status: res.status,
      code: payload?.code,
      data: payload?.data,
    });
  }

  return payload?.data;
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

// Builds a FormData body from a plain field map plus one or more files.
// `files` can be a single File/Blob, an array of them, or an object of
// { fieldName: File | File[] } for multiple named file fields.
export const toFormData = (fields = {}, files = {}) => {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  });

  Object.entries(files).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((file) => file && formData.append(key, file));
    } else if (value) {
      formData.append(key, value);
    }
  });

  return formData;
};
