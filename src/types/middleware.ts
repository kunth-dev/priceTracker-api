/**
 * TypeScript type definitions for Domain Whitelist Security Enhancement
 * These interfaces define the data structures used by the middleware
 */

/**
 * Represents the source information of an incoming HTTP request for domain validation
 */
export interface RequestOrigin {
  /** The IP address of the client making the request */
  clientIp: string;
  /** The Origin header value from the request */
  origin?: string;
  /** The Referer header value from the request */
  referer?: string;
  /** The User-Agent header for logging purposes */
  userAgent?: string;
}

/**
 * Represents the configuration for allowed domains and IP addresses
 */
export interface WhitelistConfiguration {
  /** List of allowed domain patterns */
  allowedDomains: string[];
  /** Comprehensive list of localhost IP variants */
  localhostAddresses: string[];
  /** Whether to trust proxy headers for IP detection */
  trustProxy: boolean;
  /** Whether to log security-related events */
  logSecurityEvents: boolean;
}

/**
 * Represents standardized responses for access control decisions
 */
export interface SecurityResponse {
  /** Always false for denied requests */
  success: false;
  /** Error type identifier */
  error: "Domain not allowed" | "Invalid origin" | "Access denied";
  /** Human-readable error description */
  message: string;
  /** ISO timestamp of the response */
  timestamp: string;
  /** Optional request correlation ID */
  requestId?: string;
}

/**
 * Type for localhost address validation result
 */
export type LocalhostValidationResult = {
  /** Whether the address is considered localhost */
  isLocalhost: boolean;
  /** The address format that matched (for logging) */
  matchedFormat?: "ipv4" | "ipv6" | "hostname";
  /** The specific address that was validated */
  validatedAddress: string;
};

/**
 * Environment variables configuration
 */
export interface EnvironmentConfig {
  /** Comma-separated list of allowed domains */
  ALLOWED_DOMAINS: string;
  /** Whether to trust proxy headers */
  TRUST_PROXY?: boolean;
  /** Whether to log security events */
  LOG_SECURITY_EVENTS?: boolean;
}

/**
 * Represents the result of parsing an Authorization header
 */
export interface ParsedAuthHeader {
  /** The authentication scheme (e.g., "Bearer") */
  scheme: string;
  /** The authentication token value */
  token: string;
}

/**
 * Represents the result of Bearer token authentication validation
 */
export interface BearerAuthResult {
  /** Whether authentication was successful */
  success: boolean;
  /** Whether the path is exempted from authentication */
  exempted?: boolean;
  /** Error code if authentication failed */
  error?: "Missing authorization" | "Invalid scheme" | "Invalid token" | "Malformed header";
  /** Human-readable error message */
  message?: string;
}
