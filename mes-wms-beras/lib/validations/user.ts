import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "OPR_PROD", "OPR_WHS", "DRIVER"]),
});

export const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["ADMIN", "OPR_PROD", "OPR_WHS", "DRIVER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
