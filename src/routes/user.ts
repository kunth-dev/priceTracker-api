import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Example private endpoint that requires authentication
router.get(
  "/profile",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      data: {
        message: "This is a protected endpoint",
        user: "authenticated-user",
        timestamp: new Date().toISOString(),
      },
    });
  }),
);

export default router;
