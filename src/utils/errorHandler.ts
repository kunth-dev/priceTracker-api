import { ErrorCode } from "../constants/errorCodes";
import { AppError } from "../middleware/errorHandler";

/**
 * Handles service errors and converts them to AppError with appropriate status codes and error codes
 * @param error Error thrown by service layer
 * @throws AppError with appropriate status code and error code
 */
export function handleServiceError(error: unknown): never {
  if (error instanceof Error) {
    // Map error messages to error codes and status codes
    const errorMappings: Array<{
      message: string;
      code: ErrorCode;
      status: number;
    }> = [
      {
        message: "User not found",
        code: ErrorCode.USER_NOT_FOUND,
        status: 404,
      },
      {
        message: "User with this email already exists",
        code: ErrorCode.USER_ALREADY_EXISTS,
        status: 409,
      },
      {
        message: "Email already in use",
        code: ErrorCode.EMAIL_ALREADY_IN_USE,
        status: 409,
      },
      {
        message: "Invalid credentials",
        code: ErrorCode.INVALID_CREDENTIALS,
        status: 401,
      },
      {
        message: "No reset code found for this email",
        code: ErrorCode.RESET_CODE_NOT_FOUND,
        status: 404,
      },
      {
        message: "Invalid reset code",
        code: ErrorCode.INVALID_RESET_CODE,
        status: 400,
      },
      {
        message: "Reset code has expired",
        code: ErrorCode.RESET_CODE_EXPIRED,
        status: 400,
      },
    ];

    // Find matching error mapping
    const mapping = errorMappings.find((m) => m.message === error.message);

    if (mapping) {
      throw new AppError(error.message, mapping.status, mapping.code);
    }
  }

  // Re-throw unknown errors
  throw error;
}
