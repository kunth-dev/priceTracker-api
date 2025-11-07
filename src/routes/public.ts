import { Router } from "express";

// Import public route modules
import healthRoutes from "./health";

const router = Router();

// Public routes - no authentication required
router.use("/health", healthRoutes);

export default router;
