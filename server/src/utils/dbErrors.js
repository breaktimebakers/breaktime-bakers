const UNIQUE_VIOLATION = "23505";

// Drizzle wraps the underlying pg error in a DrizzleQueryError - the
// actual Postgres error code lives at err.cause.code, not err.code
// directly. Checking err.code alone silently never matches, so a real
// unique-constraint collision falls through to a raw 500 instead of the
// intended 409.
export const isUniqueViolation = (err) => err?.code === UNIQUE_VIOLATION || err?.cause?.code === UNIQUE_VIOLATION;
