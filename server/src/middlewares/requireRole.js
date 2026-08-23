// Must run after requireAuth, which attaches req.user.role from a fresh
// DB read. The users table is shared with other codebases that may write
// other role values into it - this is what stops one of their tokens
// (same JWT secret, same DB) from reaching this app's admin-only routes
// just because it's authenticated.
export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
