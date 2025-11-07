import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getAllowedDomains } from "./config/env";
import { bearerAuth } from "./middleware/bearerAuth";
import { domainWhitelist } from "./middleware/domainWhitelist";
import { errorHandler } from "./middleware/errorHandler";

import privateRoutes from "./routes/private";
// Route imports
import publicRoutes from "./routes/public";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // Allow requests with no origin (e.g., mobile apps, Postman)
        callback(null, true);
        return;
      }

      const allowedDomains = getAllowedDomains();
      const hostname = new URL(origin).hostname;

      const isAllowed = allowedDomains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Domain whitelist middleware
app.use(domainWhitelist);

// Public routes (no authentication required)
app.use("/api", publicRoutes);

// Private routes (authentication required)
app.use("/api", bearerAuth, privateRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
