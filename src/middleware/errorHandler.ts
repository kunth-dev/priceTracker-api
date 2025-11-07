import type { NextFunction, Request, Response } from "express";
import type { ApiResponse } from "../types/api.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string | undefined;

  constructor(message: string, statusCode = 500, errorCode?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Internal server error";
  let errorCode: string | undefined;
  let isOperational = false;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode;
    isOperational = error.isOperational;
  }

  // Log error details
  console.error(`[${new Date().toISOString()}] Error ${statusCode}:`, {
    message: error.message,
    errorCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  const response: ApiResponse = {
    success: false,
    error: message,
    errorCode,
  };

  // In development, include stack trace
  if (process.env.NODE_ENV === "development" && !isOperational) {
    response.data = {
      stack: error.stack,
    };
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
