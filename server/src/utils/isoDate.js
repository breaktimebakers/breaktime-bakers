import { z } from "zod";

// Single source of truth for a "YYYY-MM-DD" field - z.iso.date() already
// rejects fake calendar dates (2026-99-99, Feb 30, unpadded months) on top
// of the shape, so every module should import this instead of rolling its
// own shape-only regex.
export const isoDateSchema = z.iso.date("Expected a valid date in YYYY-MM-DD format");

// Attaches a "from can't be after to" check to a query schema that has
// optional `from`/`to` isoDate fields. Plain string comparison is safe -
// YYYY-MM-DD sorts the same lexicographically as it does chronologically.
// Only fires when both bounds are present; an open-ended range on either
// side is left alone.
export const withDateRangeCheck = (schema) =>
  schema.refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "'from' date cannot be after 'to' date",
    path: ["to"],
  });
