/**
 * Error codes for the application
 * These codes provide machine-readable error identifiers
 */
export enum ErrorCode {
  // Validation errors (1xxx)
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_PASSWORD = "INVALID_PASSWORD",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Authentication errors (2xxx)
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  MISSING_AUTHORIZATION = "MISSING_AUTHORIZATION",
  INVALID_TOKEN = "INVALID_TOKEN",

  // User errors (3xxx)
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  EMAIL_ALREADY_IN_USE = "EMAIL_ALREADY_IN_USE",

  // Password reset errors (4xxx)
  RESET_CODE_NOT_FOUND = "RESET_CODE_NOT_FOUND",
  INVALID_RESET_CODE = "INVALID_RESET_CODE",
  RESET_CODE_EXPIRED = "RESET_CODE_EXPIRED",

  // Email verification errors (4xxx)
  VERIFICATION_CODE_NOT_FOUND = "VERIFICATION_CODE_NOT_FOUND",
  INVALID_VERIFICATION_CODE = "INVALID_VERIFICATION_CODE",
  VERIFICATION_CODE_EXPIRED = "VERIFICATION_CODE_EXPIRED",
  EMAIL_ALREADY_VERIFIED = "EMAIL_ALREADY_VERIFIED",
  INVALID_CODE_FORMAT = "INVALID_CODE_FORMAT",
  CONFIRMATION_TOKEN_NOT_FOUND = "CONFIRMATION_TOKEN_NOT_FOUND",
  INVALID_CONFIRMATION_TOKEN = "INVALID_CONFIRMATION_TOKEN",

  // Order errors (5xxx)
  ORDER_NOT_FOUND = "ORDER_NOT_FOUND",

  // Generic errors (6xxx)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
}

/**
 * Error messages mapped to error codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_FAILED]: "Validation failed",
  [ErrorCode.INVALID_EMAIL]: "Invalid email address",
  [ErrorCode.INVALID_PASSWORD]: "Invalid password",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "Missing required field",

  [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials",
  [ErrorCode.MISSING_AUTHORIZATION]: "Missing authorization",
  [ErrorCode.INVALID_TOKEN]: "Invalid token",

  [ErrorCode.USER_NOT_FOUND]: "User not found",
  [ErrorCode.USER_ALREADY_EXISTS]: "User with this email already exists",
  [ErrorCode.EMAIL_ALREADY_IN_USE]: "Email already in use",

  [ErrorCode.RESET_CODE_NOT_FOUND]: "No reset code found for this email",
  [ErrorCode.INVALID_RESET_CODE]: "Invalid reset code",
  [ErrorCode.RESET_CODE_EXPIRED]: "Reset code has expired",

  [ErrorCode.VERIFICATION_CODE_NOT_FOUND]: "No verification code found for this email",
  [ErrorCode.INVALID_VERIFICATION_CODE]: "Invalid verification code",
  [ErrorCode.VERIFICATION_CODE_EXPIRED]: "Verification code has expired",
  [ErrorCode.EMAIL_ALREADY_VERIFIED]: "Email is already verified",
  [ErrorCode.INVALID_CODE_FORMAT]: "Invalid code format",
  [ErrorCode.CONFIRMATION_TOKEN_NOT_FOUND]: "No confirmation token found",
  [ErrorCode.INVALID_CONFIRMATION_TOKEN]: "Invalid confirmation token",

  [ErrorCode.ORDER_NOT_FOUND]: "Order not found",

  [ErrorCode.INTERNAL_SERVER_ERROR]: "Internal server error",
  [ErrorCode.RESOURCE_NOT_FOUND]: "Resource not found",
};
