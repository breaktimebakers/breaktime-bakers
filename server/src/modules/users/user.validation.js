import { z } from "zod";

export const userIdParamSchema = z.object({
  id: z.string().min(1),
});

export const changePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be atleast 8 characters")
    .max(72, "Password cannot exceed 72 characters"),
});
