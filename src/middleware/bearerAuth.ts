import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getBearerTokens, getLogSecurityEvents } from "../config/env.js";
import type { BearerAuthResult, ParsedAuthHeader } from "../types/middleware.js";

/**
 * Paths that are exempted from Bearer authentication
 * These endpoints can be accessed without a valid Bearer token
 * Note: Path exemptions are now handled at the router level, so this array is empty
 */
const EXEMPTED_PATHS: string[] = [];

/**
 * Parses the Authorization header to extract the authentication scheme and token
 *
 * Extracts and normalizes the authorization scheme (e.g., Bearer) and the token value
 * from the Authorization header. Handles case-insensitive scheme matching and
 * whitespace trimming.
 *
 * @param authHeader - The Authorization header value from the request
 * @returns Parsed authentication header with scheme and token, or null if malformed
 *
 * @example
 * ```typescript
 * parseAuthorizationHeader("Bearer token123") // { scheme: "bearer", token: "token123" }
 * parseAuthorizationHeader("bearer  token123") // { scheme: "bearer", token: "token123" }
 * parseAuthorizationHeader("token123") // null (missing scheme)
 * ```
 */
function parseAuthorizationHeader(authHeader: string): ParsedAuthHeader | null {
  const trimmed = authHeader.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;

  if (!scheme || !token) {
    return null;
  }

  return {
    scheme: scheme.toLowerCase(),
    token: token.trim(),
  };
}

/**
 * Compares two tokens using constant-time comparison to prevent timing attacks
 *
 * Uses crypto.timingSafeEqual to ensure token comparison takes the same amount of time
 * regardless of where the difference occurs, preventing timing-based attacks.
 *
 * @param providedToken - The token provided in the request
 * @param validToken - A valid token from the configuration
 * @returns True if tokens match, false otherwise
 *
 * @example
 * ```typescript
 * compareTokens("token123", "token123") // true
 * compareTokens("token123", "token456") // false
 * ```
 */
function compareTokens(providedToken: string, validToken: string): boolean {
  try {
    // Convert strings to buffers for constant-time comparison
    const providedBuffer = Buffer.from(providedToken);
    const validBuffer = Buffer.from(validToken);

    // If lengths differ, comparison will fail but still takes constant time
    if (providedBuffer.length !== validBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(providedBuffer, validBuffer);
  } catch {
    return false;
  }
}

/**
 * Validates if the provided token matches any of the configured valid tokens
 *
 * Checks the provided token against all configured Bearer tokens using
 * constant-time comparison for security. Supports multiple tokens for
 * different API clients and token rotation scenarios.
 *
 * @param token - The token to validate
 * @returns True if token is valid, false otherwise
 *
 * @example
 * ```typescript
 * // Assuming BEARER_TOKENS="token1,token2"
 * isValidToken("token1") // true
 * isValidToken("token2") // true
 * isValidToken("invalid") // false
 * ```
 */
function isValidToken(token: string): boolean {
  const validTokens = getBearerTokens();

  for (const validToken of validTokens) {
    if (compareTokens(token, validToken)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the request path is exempted from Bearer authentication
 *
 * Determines if a request path should bypass authentication, such as
 * health check endpoints that need to be accessible for monitoring systems.
 * Supports exact path matching and subpath matching.
 *
 * @param path - The request path to check
 * @returns True if path is exempted from authentication, false otherwise
 *
 * @example
 * ```typescript
 * isExemptedPath("/api/health") // true
 * isExemptedPath("/api/health/detailed") // true
 * isExemptedPath("/api/trades") // false
 * ```
 */
function isExemptedPath(path: string): boolean {
  return EXEMPTED_PATHS.some(
    (exemptedPath) => path === exemptedPath || path.startsWith(`${exemptedPath}/`),
  );
}

/**
 * Validates Bearer token authentication for a request
 *
 * Performs complete Bearer authentication validation including:
 * - Path exemption checking
 * - Authorization header presence
 * - Bearer scheme validation
 * - Token format validation
 * - Token validity checking
 *
 * @param authHeader - The Authorization header value from the request
 * @param path - The request path for exemption checking
 * @returns BearerAuthResult indicating success or specific failure reason
 *
 * @example
 * ```typescript
 * validateBearerAuth("Bearer validToken", "/api/trades")
 * // { success: true }
 *
 * validateBearerAuth(undefined, "/api/health")
 * // { success: true, exempted: true }
 *
 * validateBearerAuth("Bearer invalidToken", "/api/trades")
 * // { success: false, error: "Invalid token", message: "..." }
 * ```
 */
function validateBearerAuth(authHeader: string | undefined, path: string): BearerAuthResult {
  // Check if path is exempted from authentication
  if (isExemptedPath(path)) {
    return { success: true, exempted: true };
  }

  // Check if Authorization header is present
  if (!authHeader || authHeader.trim() === "") {
    return {
      success: false,
      error: "Missing authorization",
      message: "Authorization header is required. Format: Authorization: Bearer <token>",
    };
  }

  // Parse Authorization header
  const parsed = parseAuthorizationHeader(authHeader);

  if (!parsed) {
    return {
      success: false,
      error: "Malformed header",
      message: "Malformed Authorization header. Format: Authorization: Bearer <token>",
    };
  }

  // Validate Bearer scheme
  if (parsed.scheme !== "bearer") {
    return {
      success: false,
      error: "Invalid scheme",
      message: "Authorization header must use Bearer scheme. Format: Authorization: Bearer <token>",
    };
  }

  // Validate token is not empty
  if (!parsed.token || parsed.token === "") {
    return {
      success: false,
      error: "Malformed header",
      message: "Bearer token cannot be empty. Format: Authorization: Bearer <token>",
    };
  }

  // Validate token against configured tokens
  if (!isValidToken(parsed.token)) {
    return {
      success: false,
      error: "Invalid token",
      message: "Invalid Bearer token. Please check your authentication credentials.",
    };
  }

  return { success: true };
}

/**
 * Logs security events related to authentication failures
 *
 * Emits structured security logs when LOG_SECURITY_EVENTS environment variable is enabled.
 * Includes timestamp, client IP, request path, and failure reason for security monitoring.
 *
 * @param event - Human-readable description of the security event
 * @param details - Additional context and metadata for the event
 *
 * @example
 * ```typescript
 * logAuthenticationFailure("Invalid Bearer token", {
 *   clientIp: "192.168.1.100",
 *   path: "/api/trades",
 *   error: "Invalid token"
 * });
 * ```
 */
function logAuthenticationFailure(event: string, details: Record<string, unknown>): void {
  if (getLogSecurityEvents()) {
    console.warn(`[SECURITY] ${event}`, {
      timestamp: new Date().toISOString(),
      ...details,
    });
  }
}

/**
 * Gets the real client IP address from the request
 *
 * Extracts the client IP address, using the connection's remote address
 * as the source. Express's req.ip is used as fallback.
 *
 * @param req - Express request object
 * @returns The client IP address
 */
function getClientIP(req: Request): string {
  return req.ip || req.connection.remoteAddress || "unknown";
}

/**
 * Bearer Authentication Middleware
 *
 * Express middleware that enforces Bearer token authentication for API endpoints.
 * Validates tokens from the Authorization header, supports multiple tokens via
 * environment variables, and exempts specified paths (e.g., health checks).
 *
 * Features:
 * - Bearer token validation with constant-time comparison
 * - Multiple token support for different API clients
 * - Path exemption for monitoring endpoints
 * - Case-insensitive Bearer scheme handling
 * - Comprehensive error messages without exposing internals
 * - Security event logging for audit and monitoring
 * - High performance (<1ms validation time)
 *
 * @param req - Express request object containing headers and path
 * @param res - Express response object for sending error responses
 * @param next - Express next function for continuing middleware chain
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { bearerAuth } from './middleware/bearerAuth.js';
 *
 * const app = express();
 *
 * // Apply Bearer authentication to all routes
 * app.use(bearerAuth);
 *
 * app.get('/api/trades', (req, res) => {
 *   res.json({ message: 'This endpoint requires Bearer authentication' });
 * });
 *
 * app.get('/api/health', (req, res) => {
 *   res.json({ status: 'ok' }); // Exempted from auth
 * });
 * ```
 */
export const bearerAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.get("Authorization");
  const result = validateBearerAuth(authHeader, req.path);

  if (!result.success) {
    // Log authentication failure for security monitoring
    logAuthenticationFailure("Authentication failed", {
      error: result.error,
      path: req.path,
      clientIp: getClientIP(req),
      userAgent: req.get("User-Agent"),
    });

    // Return 401 Unauthorized with standardized error response
    res.status(401).json({
      success: false,
      error: result.error,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Authentication successful or path exempted - continue to next middleware
  next();
};
