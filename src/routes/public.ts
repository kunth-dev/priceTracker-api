import { Router } from "express";

// Import public route modules
import healthRoutes from "./health";
import userPublicRoutes from "./userPublic";

const router = Router();

// Public routes - no authentication required
router.use("/health", healthRoutes);
router.use("/user", userPublicRoutes);

export default router;
