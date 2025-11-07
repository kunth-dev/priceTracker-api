import { z } from "zod";

// User data type
export interface User {
  userId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Request validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const SendResetCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(6, "Reset code must be at least 6 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").optional(),
});

// Type inference from schemas
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type SendResetCodeRequest = z.infer<typeof SendResetCodeSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
