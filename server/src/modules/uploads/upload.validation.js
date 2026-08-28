import { z } from "zod";

// Whitelisted destinations, not a free-text path - keeps callers from
// steering uploads into arbitrary bucket locations.
const ALLOWED_FOLDERS = ["receipts/raw-materials", "photos/workers", "receipts/expenses", "receipts/taxes"];

export const createUploadUrlSchema = z.object({
  folder: z.enum(ALLOWED_FOLDERS),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(100),
});
