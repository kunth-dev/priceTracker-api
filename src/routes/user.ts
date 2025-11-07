import { Router } from "express";
import type { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import * as userService from "../services/userService";
import type { ApiResponse } from "../types/api";
import { UpdateUserSchema } from "../types/user";

const router = Router();

// Get user data (GET /api/user/:userId)
router.get(
  "/:userId",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = userService.getUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
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
      throw new AppError("User ID is required", 400);
    }

    try {
      userService.deleteUser(userId);

      const response: ApiResponse = {
        success: true,
        message: "User deleted successfully",
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

// Update user data (PUT /api/user/:userId)
router.put(
  "/:userId",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const validationResult = UpdateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Validation failed";
      throw new AppError(errorMessage, 400);
    }

    const updates = validationResult.data;

    // Filter out undefined values
    const filteredUpdates: { email?: string; password?: string } = {};
    if (updates.email !== undefined) {
      filteredUpdates.email = updates.email;
    }
    if (updates.password !== undefined) {
      filteredUpdates.password = updates.password;
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new AppError("At least one field must be provided for update", 400);
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
      if (error instanceof Error) {
        if (error.message === "User not found") {
          throw new AppError(error.message, 404);
        }
        if (error.message === "Email already in use") {
          throw new AppError(error.message, 409);
        }
      }
      throw error;
    }
  }),
);

export default router;
