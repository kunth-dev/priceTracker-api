import { Router } from "express";
import type { Request, Response } from "express";
import { ErrorCode } from "../constants/errorCodes";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../middleware/errorHandler";
import * as orderService from "../services/orderService";
import type { ApiResponse } from "../types/api";
import { CreateOrderSchema, UpdateOrderSchema } from "../types/order";
import { handleServiceError } from "../utils/errorHandler";
import { validateRequest } from "../utils/validation";

const router = Router();

// Create order (POST /api/order)
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const orderData = validateRequest(CreateOrderSchema, req.body);

    const newOrder = await orderService.createOrder(
      orderData.title,
      orderData.price,
      orderData.link,
      orderData.status,
    );

    const response: ApiResponse = {
      success: true,
      data: newOrder,
      message: "Order created successfully",
    };

    res.status(201).json(response);
  }),
);

// Get order by ID (GET /api/order/:orderId)
router.get(
  "/:orderId",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError("Order ID is required", 400, ErrorCode.MISSING_REQUIRED_FIELD);
    }

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404, ErrorCode.ORDER_NOT_FOUND);
    }

    const response: ApiResponse = {
      success: true,
      data: order,
    };

    res.status(200).json(response);
  }),
);

// Update order (PATCH /api/order/:orderId)
router.patch(
  "/:orderId",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError("Order ID is required", 400, ErrorCode.MISSING_REQUIRED_FIELD);
    }

    const updates = validateRequest(UpdateOrderSchema, req.body);

    // Filter out undefined values
    const filteredUpdates: {
      title?: string;
      price?: string;
      link?: string;
      status?: string;
    } = {};

    if (updates.title !== undefined) {
      filteredUpdates.title = updates.title;
    }
    if (updates.price !== undefined) {
      filteredUpdates.price = updates.price;
    }
    if (updates.link !== undefined) {
      filteredUpdates.link = updates.link;
    }
    if (updates.status !== undefined) {
      filteredUpdates.status = updates.status;
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new AppError(
        "At least one field must be provided for update",
        400,
        ErrorCode.MISSING_REQUIRED_FIELD,
      );
    }

    try {
      const updatedOrder = await orderService.updateOrder(orderId, filteredUpdates);

      const response: ApiResponse = {
        success: true,
        data: updatedOrder,
        message: "Order updated successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

// Delete order by ID (DELETE /api/order/:orderId)
router.delete(
  "/:orderId",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError("Order ID is required", 400, ErrorCode.MISSING_REQUIRED_FIELD);
    }

    try {
      await orderService.deleteOrder(orderId);

      const response: ApiResponse = {
        success: true,
        message: "Order deleted successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      handleServiceError(error);
    }
  }),
);

export default router;
