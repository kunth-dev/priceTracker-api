import { Router } from "express";

// Import private route modules
// Add your authenticated routes here
import orderRoutes from "./order";
import userRoutes from "./user";
// import tradeRoutes from "./trade";

const router = Router();

// Private routes - authentication required
router.use("/order", orderRoutes);
router.use("/user", userRoutes);
// router.use("/trades", tradeRoutes);

export default router;
