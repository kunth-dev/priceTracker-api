import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as userService from "../services/userService";
import type { ApiResponse } from "../types/api";
import {
  ConfirmAccountSchema,
  CreateUserSchema,
  ForgotPasswordSchema,
  LoginSchema,
  ResendConfirmationEmailSchema,
  ResendVerificationCodeSchema,
  ResetPasswordSchema,
  SendResetCodeSchema,
  VerifyEmailSchema,
} from "../types/user";
import { handleServiceError } from "../utils/errorHandler";
import { validateRequest } from "../utils/validation";

const router = Router();

// Register user (POST /api/auth/register)
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = validateRequest(CreateUserSchema, req.body);

    try {
      const user = await userService.createUser(email, password);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: "User created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Login user (POST /api/auth/login)
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = validateRequest(LoginSchema, req.body);

    try {
      const user = await userService.loginUser(email, password);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: "Login successful",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Send reset password code (POST /api/auth/send-reset-code)
// NOTE: Rate limiting should be implemented in production (e.g., max 3 requests per hour per email)
// to prevent abuse of code generation
router.post(
  "/send-reset-code",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = validateRequest(SendResetCodeSchema, req.body);

    try {
      const { expiresAt } = await userService.sendResetCode(email);

      const response: ApiResponse = {
        success: true,
        message: "Reset code sent to email",
        data: {
          expiresAt: expiresAt.toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Reset password (POST /api/auth/reset-password)
router.post(
  "/reset-password",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, code, newPassword } = validateRequest(ResetPasswordSchema, req.body);

    try {
      await userService.resetPassword(email, code, newPassword);

      const response: ApiResponse = {
        success: true,
        message: "Password reset successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Forgot password (POST /api/auth/forgot-password)
// Note: This endpoint duplicates send-reset-code functionality. In the issue specification,
// both "send reset password code" and "forgot password" were listed as separate requirements.
// They both send a reset code to the user's email. In a production system, you might want to
// consolidate these or differentiate their purposes (e.g., forgot-password could trigger
// additional security measures, logging, or rate limiting).
router.post(
  "/forgot-password",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = validateRequest(ForgotPasswordSchema, req.body);

    try {
      const { expiresAt } = await userService.sendResetCode(email);

      const response: ApiResponse = {
        success: true,
        message: "Reset code sent to email",
        data: {
          expiresAt: expiresAt.toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Verify email with OTP code (POST /api/auth/verify-email)
// NOTE: Rate limiting should be implemented in production (e.g., max 5 attempts per 15 minutes per email)
// to prevent brute force attacks on verification codes
router.post(
  "/verify-email",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, code } = validateRequest(VerifyEmailSchema, req.body);

    try {
      await userService.verifyEmail(email, code);

      const response: ApiResponse = {
        success: true,
        message: "Email verified successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Resend email verification code (POST /api/auth/resend-verification-code)
// NOTE: Rate limiting should be implemented in production (e.g., max 3 requests per hour per email)
// to prevent abuse of code generation
router.post(
  "/resend-verification-code",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = validateRequest(ResendVerificationCodeSchema, req.body);

    try {
      await userService.sendVerificationCode(email);

      const response: ApiResponse = {
        success: true,
        message: "Verification code sent successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Confirm account by UUID token (POST /api/auth/register-confirmation)
router.post(
  "/register-confirmation",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { uuid } = validateRequest(ConfirmAccountSchema, req.body);

    try {
      await userService.confirmAccountByToken(uuid);

      const response: ApiResponse = {
        success: true,
        message: "Account confirmed successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Resend confirmation email (POST /api/auth/resend-confirmation-email)
// NOTE: Rate limiting should be implemented in production (e.g., max 3 requests per hour per email)
// to prevent abuse of email sending
router.post(
  "/resend-confirmation-email",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = validateRequest(ResendConfirmationEmailSchema, req.body);

    try {
      await userService.resendConfirmationEmail(email);

      const response: ApiResponse = {
        success: true,
        message: "Confirmation email sent successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

export default router;
