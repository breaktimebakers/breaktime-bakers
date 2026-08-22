export const errorHandler = (err, _req, res, _next) => {
  const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Something went wrong";
  const code = typeof err?.code === "string" ? err.code : undefined;

  res.status(statusCode).json({
    success: false,
    ...(code ? { code } : {}),
    message,
  });
};
