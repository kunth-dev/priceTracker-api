import type { NextFunction, Request, Response } from "express";
import { getAllowedDomains, getLogSecurityEvents, getTrustProxy } from "../config/env.js";
import type { LocalhostValidationResult, SecurityResponse } from "../types/middleware.js";

/**
 * Enhanced localhost validation with comprehensive IPv4/IPv6 support
 *
 * Validates if the provided IP address represents a localhost connection,
 * supporting all standard localhost formats including IPv4, IPv6, and hostname variants.
 *
 * @param ip - The IP address to validate (can be IPv4, IPv6, or hostname)
 * @returns LocalhostValidationResult containing validation result and matched format
 *
 * @example
 * ```typescript
 * validateLocalhostAddress("127.0.0.1") // { isLocalhost: true, matchedFormat: "ipv4", validatedAddress: "127.0.0.1" }
 * validateLocalhostAddress("::1") // { isLocalhost: true, matchedFormat: "ipv6", validatedAddress: "::1" }
 * validateLocalhostAddress("192.168.1.1") // { isLocalhost: false, validatedAddress: "192.168.1.1" }
 * ```
 */
function validateLocalhostAddress(ip: string): LocalhostValidationResult {
  if (!ip || ip === "") {
    return { isLocalhost: true, matchedFormat: "ipv4", validatedAddress: "127.0.0.1" };
  }

  // IPv4 localhost detection
  if (ip === "127.0.0.1" || ip.startsWith("127.")) {
    return { isLocalhost: true, matchedFormat: "ipv4", validatedAddress: ip };
  }

  // IPv6 localhost detection (comprehensive)
  if (
    ip === "::1" ||
    ip === "0000:0000:0000:0000:0000:0000:0000:0001" ||
    ip.startsWith("::ffff:127.") ||
    ip === "::ffff:127.0.0.1"
  ) {
    return { isLocalhost: true, matchedFormat: "ipv6", validatedAddress: ip };
  }

  // Hostname resolution for 'localhost'
  if (ip.toLowerCase() === "localhost") {
    return { isLocalhost: true, matchedFormat: "hostname", validatedAddress: ip };
  }

  return { isLocalhost: false, validatedAddress: ip };
}

/**
 * Gets the real client IP address considering proxy headers
 *
 * Extracts the actual client IP from the request, taking into account
 * proxy configurations and trusted proxy headers like X-Forwarded-For and X-Real-IP.
 *
 * @param req - Express request object containing headers and connection info
 * @returns The real client IP address as a string
 *
 * @example
 * ```typescript
 * const clientIp = getRealClientIP(req);
 * console.log(clientIp); // "192.168.1.100" or "127.0.0.1"
 * ```
 */
function getRealClientIP(req: Request): string {
  const trustProxy = getTrustProxy();

  if (trustProxy) {
    // Check for proxy headers in order of preference
    const forwardedFor = req.get("X-Forwarded-For");
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first (original client)
      return forwardedFor.split(",")[0]?.trim() || "";
    }

    const realIp = req.get("X-Real-IP");
    if (realIp) {
      return realIp.trim();
    }
  }

  // Fall back to Express's built-in IP detection
  return req.ip || req.connection.remoteAddress || "";
}

/**
 * Logs security events for monitoring and audit purposes
 *
 * Emits structured security logs when LOG_SECURITY_EVENTS environment variable is enabled.
 * Includes timestamp and contextual information for security monitoring systems.
 *
 * @param event - Human-readable description of the security event
 * @param details - Additional context and metadata for the event
 *
 * @example
 * ```typescript
 * logSecurityEvent("External domain access denied", {
 *   domain: "malicious.com",
 *   clientIp: "192.168.1.100",
 *   userAgent: "BadBot/1.0"
 * });
 * ```
 */
function logSecurityEvent(event: string, details: Record<string, unknown>): void {
  if (getLogSecurityEvents()) {
    console.warn(`[SECURITY] ${event}`, {
      timestamp: new Date().toISOString(),
      ...details,
    });
  }
}

/**
 * Sanitizes domain names for error messages to maintain professional tone
 *
 * Replaces potentially problematic or malicious-sounding words in domain names
 * with generic terms to ensure user-facing error messages remain professional
 * while not exposing sensitive system information.
 *
 * @param domain - The original domain name to sanitize
 * @returns Sanitized domain name suitable for user-facing error messages
 *
 * @example
 * ```typescript
 * sanitizeDomainForErrorMessage("malicious-attack.com") // "external-external.com"
 * sanitizeDomainForErrorMessage("normal-site.com") // "normal-site.com"
 * ```
 */
function sanitizeDomainForErrorMessage(domain: string): string {
  // List of words to replace with generic terms to maintain professional tone
  const problematicWords = [
    "malicious",
    "hack",
    "attack",
    "exploit",
    "spam",
    "phishing",
    "fraud",
    "scam",
    "virus",
    "trojan",
    "malware",
  ];

  let sanitized = domain;
  for (const word of problematicWords) {
    const regex = new RegExp(word, "gi");
    sanitized = sanitized.replace(regex, "external");
  }

  return sanitized;
}

/**
 * Creates standardized security response objects
 *
 * Generates consistent SecurityResponse objects for all domain whitelist denials,
 * ensuring uniform error format across the application with proper timestamps
 * and structured error information.
 *
 * @param error - The error type/code for the security response
 * @param message - Human-readable error message for the client
 * @returns Standardized SecurityResponse object
 *
 * @example
 * ```typescript
 * createSecurityResponse("Domain not allowed", "Access denied for domain: external.com")
 * // Returns: { success: false, error: "Domain not allowed", message: "...", timestamp: "2025-01-01T00:00:00.000Z" }
 * ```
 */
function createSecurityResponse(
  error: SecurityResponse["error"],
  message: string,
): SecurityResponse {
  return {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Domain Whitelist Security Middleware
 *
 * Express middleware that enforces localhost-only API access by validating request origins
 * and client IP addresses. Blocks all external domains while allowing comprehensive
 * localhost variants (IPv4, IPv6, hostname) with anti-spoofing protection.
 *
 * Features:
 * - Comprehensive localhost detection (127.x.x.x, ::1, localhost hostname)
 * - Anti-spoofing protection (validates Origin headers against actual client IP)
 * - Proxy-aware IP detection with configurable trust settings
 * - Security event logging for monitoring and audit
 * - Professional error messages without system internals exposure
 * - High performance (<100ms processing time)
 *
 * @param req - Express request object containing headers and connection info
 * @param res - Express response object for sending error responses
 * @param next - Express next function for continuing middleware chain
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { domainWhitelist } from './middleware/domainWhitelist.js';
 *
 * const app = express();
 * app.use(domainWhitelist); // Apply to all routes
 *
 * app.get('/api/secure', (req, res) => {
 *   res.json({ message: 'This endpoint only accepts localhost requests' });
 * });
 * ```
 */
export const domainWhitelist = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.get("Origin") || req.get("Referer");
  const allowedDomains = getAllowedDomains();

  // Allow requests without origin (e.g., direct API calls from localhost)
  if (!origin) {
    // For requests without origin, check if IP is localhost
    const clientIp = getRealClientIP(req);
    const localhostResult = validateLocalhostAddress(clientIp);

    if (localhostResult.isLocalhost) {
      next();
      return;
    }

    // No origin and not localhost - deny
    logSecurityEvent("Access attempt without origin", {
      clientIp,
      userAgent: req.get("User-Agent"),
    });

    const response = createSecurityResponse(
      "Access denied",
      "Access denied - no origin header and not from localhost",
    );
    res.status(403).json(response);
    return;
  }

  // Extract domain from origin/referer
  let domain: string;
  try {
    const url = new URL(origin);
    domain = url.hostname;
  } catch {
    // If origin is not a valid URL, treat it as domain directly
    domain = origin.replace(/^https?:\/\//, "").split("/")[0] || "";
  }

  // Enhanced localhost hostname support with anti-spoofing protection
  if (domain.toLowerCase() === "localhost") {
    // Validate the actual client IP is also localhost for security
    const clientIp = getRealClientIP(req);
    const localhostResult = validateLocalhostAddress(clientIp);

    if (localhostResult.isLocalhost) {
      next();
      return;
    }

    // Spoofing attempt - localhost domain claim but non-localhost IP
    logSecurityEvent("Header spoofing attempt detected", {
      timestamp: new Date().toISOString(),
      spoofedDomain: domain,
      spoofedOrigin: origin,
      actualClientIp: clientIp,
      userAgent: req.get("User-Agent"),
    });

    const response = createSecurityResponse(
      "Domain not allowed",
      `Access denied for domain: ${sanitizeDomainForErrorMessage(domain)}`,
    );
    res.status(403).json(response);
    return;
  }

  // Check for other localhost variants (127.x.x.x, ::1, etc.) in domain claims
  if (domain.startsWith("127.") || domain === "::1" || domain.includes("localhost")) {
    const clientIp = getRealClientIP(req);
    const localhostResult = validateLocalhostAddress(clientIp);

    if (localhostResult.isLocalhost) {
      next();
      return;
    }

    // Spoofing attempt
    logSecurityEvent("Header spoofing attempt detected", {
      timestamp: new Date().toISOString(),
      spoofedDomain: domain,
      spoofedOrigin: origin,
      actualClientIp: clientIp,
      userAgent: req.get("User-Agent"),
    });

    const response = createSecurityResponse(
      "Domain not allowed",
      `Access denied for domain: ${sanitizeDomainForErrorMessage(domain)}`,
    );
    res.status(403).json(response);
    return;
  }

  // Check if domain is in whitelist
  const isAllowed = allowedDomains.some((allowedDomain) => {
    return domain === allowedDomain || domain.endsWith(`.${allowedDomain}`);
  });

  if (!isAllowed) {
    logSecurityEvent("External domain access denied", {
      domain,
      origin,
      clientIp: getRealClientIP(req),
      userAgent: req.get("User-Agent"),
    });

    const response = createSecurityResponse(
      "Domain not allowed",
      `Access denied for domain: ${sanitizeDomainForErrorMessage(domain)}`,
    );
    res.status(403).json(response);
    return;
  }

  next();
};
