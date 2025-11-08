import { ErrorCode } from "../constants/errorCodes";
import { AppError } from "../middleware/errorHandler";

// ServiceError interface to match the error thrown by userService
interface ServiceError extends Error {
  errorCode: ErrorCode;
}

/**
 * Type guard to check if error is a ServiceError
 */
function isServiceError(error: unknown): error is ServiceError {
  return (
    error instanceof Error &&
    "errorCode" in error &&
    typeof (error as ServiceError).errorCode === "string"
  );
}

/**
 * Handles service errors and converts them to AppError with appropriate status codes and error codes
 * @param error Error thrown by service layer
 * @throws AppError with appropriate status code and error code
 */
export function handleServiceError(error: unknown): never {
  // Handle ServiceError with error codes
  if (isServiceError(error)) {
    const errorCodeToStatus: Record<ErrorCode, number> = {
      [ErrorCode.VALIDATION_FAILED]: 400,
      [ErrorCode.INVALID_EMAIL]: 400,
      [ErrorCode.INVALID_PASSWORD]: 400,
      [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
      [ErrorCode.INVALID_CREDENTIALS]: 401,
      [ErrorCode.MISSING_AUTHORIZATION]: 401,
      [ErrorCode.INVALID_TOKEN]: 401,
      [ErrorCode.USER_NOT_FOUND]: 404,
      [ErrorCode.USER_ALREADY_EXISTS]: 409,
      [ErrorCode.EMAIL_ALREADY_IN_USE]: 409,
      [ErrorCode.RESET_CODE_NOT_FOUND]: 404,
      [ErrorCode.INVALID_RESET_CODE]: 400,
      [ErrorCode.RESET_CODE_EXPIRED]: 400,
      [ErrorCode.ORDER_NOT_FOUND]: 404,
      [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
      [ErrorCode.RESOURCE_NOT_FOUND]: 404,
    };

    const status = errorCodeToStatus[error.errorCode] || 500;
    throw new AppError(error.message, status, error.errorCode);
  }

  // Re-throw unknown errors
  throw error;
}
