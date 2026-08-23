import { ZodError } from "zod";

const respondWithZodError = (res, err) => {
  res.status(400).json({
    success: false,
    message: "Validation Failed",
    errors: err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
};

export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        respondWithZodError(res, err);
        return;
      }
      next(err);
    }
  };

// Express 5 defines req.query as a read-only getter (parsed on demand from
// req.url), so it can't be reassigned the way validate() does for
// body/params. Parses onto req.validatedQuery instead.
export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      respondWithZodError(res, err);
      return;
    }
    next(err);
  }
};
