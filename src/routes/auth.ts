import { Router } from "express";
import type { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import * as userService from "../services/userService";
import type { ApiResponse } from "../types/api";
import {
  CreateUserSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SendResetCodeSchema,
} from "../types/user";

const router = Router();

// Register user (POST /api/auth/register)
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = CreateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Validation failed";
      throw new AppError(errorMessage, 400);
    }

    const { email, password } = validationResult.data;

    try {
      const user = userService.createUser(email, password);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: "User created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "User with this email already exists") {
        throw new AppError(error.message, 409);
      }
      throw error;
    }
  }),
);

// Send reset password code (POST /api/auth/send-reset-code)
router.post(
  "/send-reset-code",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = SendResetCodeSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Validation failed";
      throw new AppError(errorMessage, 400);
    }

    const { email } = validationResult.data;

    try {
      const { expiresAt } = userService.sendResetCode(email);

      const response: ApiResponse = {
        success: true,
        message: "Reset code sent to email",
        data: {
          expiresAt: expiresAt.toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        throw new AppError(error.message, 404);
      }
      throw error;
    }
  }),
);

// Reset password (POST /api/auth/reset-password)
router.post(
  "/reset-password",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validationResult = ResetPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Validation failed";
      throw new AppError(errorMessage, 400);
    }

    const { email, code, newPassword } = validationResult.data;

    try {
      userService.resetPassword(email, code, newPassword);

      const response: ApiResponse = {
        success: true,
        message: "Password reset successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "User not found" ||
          error.message === "No reset code found for this email"
        ) {
          throw new AppError(error.message, 404);
        }
        if (error.message === "Invalid reset code" || error.message === "Reset code has expired") {
          throw new AppError(error.message, 400);
        }
      }
      throw error;
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
    const validationResult = ForgotPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Validation failed";
      throw new AppError(errorMessage, 400);
    }

    const { email } = validationResult.data;

    try {
      const { expiresAt } = userService.sendResetCode(email);

      const response: ApiResponse = {
        success: true,
        message: "Reset code sent to email",
        data: {
          expiresAt: expiresAt.toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        throw new AppError(error.message, 404);
      }
      throw error;
    }
  }),
);

export default router;
