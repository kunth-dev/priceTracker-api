import { Router } from "express";
import type { Request, Response } from "express";
import { ErrorCode } from "../constants/errorCodes";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../middleware/errorHandler";
import * as userService from "../services/userService";
import type { ApiResponse } from "../types/api";
import { UpdateUserSchema } from "../types/user";
import { handleServiceError } from "../utils/errorHandler";
import { validateRequest } from "../utils/validation";

const router = Router();

// Get user data (GET /api/user/:userId)
router.get(
  "/:userId",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400, ErrorCode.MISSING_REQUIRED_FIELD);
    }

    const user = userService.getUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404, ErrorCode.USER_NOT_FOUND);
    }

    const response: ApiResponse = {
      success: true,
      data: user,
    };

    res.status(200).json(response);
  }),
);

// Delete user (DELETE /api/user/:userId)
router.delete(
  "/:userId",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400, ErrorCode.MISSING_REQUIRED_FIELD);
    }

    try {
      userService.deleteUser(userId);

      const response: ApiResponse = {
        success: true,
        message: "User deleted successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Update user data (PATCH /api/user/:userId)
router.patch(
  "/:userId",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400, ErrorCode.MISSING_REQUIRED_FIELD);
    }

    const updates = validateRequest(UpdateUserSchema, req.body);

    // Filter out undefined values
    const filteredUpdates: { email?: string; password?: string } = {};
    if (updates.email !== undefined) {
      filteredUpdates.email = updates.email;
    }
    if (updates.password !== undefined) {
      filteredUpdates.password = updates.password;
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new AppError(
        "At least one field must be provided for update",
        400,
        ErrorCode.MISSING_REQUIRED_FIELD,
      );
    }

    try {
      const updatedUser = userService.updateUser(userId, filteredUpdates);

      const response: ApiResponse = {
        success: true,
        data: updatedUser,
        message: "User updated successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

export default router;
