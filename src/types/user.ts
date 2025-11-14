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

// Email-only schema used for password reset requests and resending codes
export const EmailOnlySchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().min(6, "Reset code must be at least 6 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const VerifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must be exactly 6 digits"),
});

export const ResendVerificationCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ConfirmAccountSchema = z.object({
  uuid: z.string().uuid("Invalid UUID format"),
});

export const ResendConfirmationEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Type inference from schemas
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type EmailOnlyRequest = z.infer<typeof EmailOnlySchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationCodeRequest = z.infer<typeof ResendVerificationCodeSchema>;
export type ConfirmAccountRequest = z.infer<typeof ConfirmAccountSchema>;
export type ResendConfirmationEmailRequest = z.infer<typeof ResendConfirmationEmailSchema>;

// Deprecated: Use EmailOnlySchema instead
/** @deprecated Use EmailOnlySchema for both send-reset-code and forgot-password endpoints */
export const SendResetCodeSchema = EmailOnlySchema;
/** @deprecated Use EmailOnlySchema for both send-reset-code and forgot-password endpoints */
export const ForgotPasswordSchema = EmailOnlySchema;
/** @deprecated Use EmailOnlyRequest type instead */
export type SendResetCodeRequest = EmailOnlyRequest;
/** @deprecated Use EmailOnlyRequest type instead */
export type ForgotPasswordRequest = EmailOnlyRequest;
