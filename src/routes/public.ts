import { Router } from "express";

// Import public route modules
import authRoutes from "./auth";
import healthRoutes from "./health";

const router = Router();

// Public routes - no authentication required
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

export default router;
