import type { ZodSchema } from "zod";
import { ErrorCode } from "../constants/errorCodes";
import { AppError } from "../middleware/errorHandler";

/**
 * Validates request body using a Zod schema and throws AppError if validation fails
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validated data
 * @throws AppError with validation error message and code
 */
export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): T {
  const validationResult = schema.safeParse(data);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors[0]?.message || "Validation failed";
    throw new AppError(errorMessage, 400, ErrorCode.VALIDATION_FAILED);
  }

  return validationResult.data;
}
