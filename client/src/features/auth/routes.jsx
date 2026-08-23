import { createRoute, redirect } from "@tanstack/react-router";
import { fullPageLayoutRoute } from "@/router/fullPageLayoutRoute";
import { queryClient } from "@/lib/queryClient";
import { AUTH_ME_STALE_TIME_MS, authKeys, fetchCurrentUser } from "./hooks/useAuth";
import Login from "./pages/Login";

const redirectIfAuthenticated = async () => {
  let user;

  try {
    user = await queryClient.query({
      queryKey: authKeys.me,
      queryFn: fetchCurrentUser,
      staleTime: AUTH_ME_STALE_TIME_MS,
    });
  } catch {
    return;
  }

  if (user) throw redirect({ to: "/inventory" });
};

const loginRoute = createRoute({
  getParentRoute: () => fullPageLayoutRoute,
  path: "/login",
  validateSearch: (search) => ({
    sessionExpired: search?.sessionExpired === true || search?.sessionExpired === "true",
  }),
  beforeLoad: redirectIfAuthenticated,
  component: Login,
});

export const authRoutes = [loginRoute];
