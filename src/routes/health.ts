import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// Health check endpoint - does not depend on external APIs
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        apiAvailable: true,
      },
    });
  }),
);

export default router;
