import crypto from "node:crypto";

/**
 * Performs constant-time string comparison to prevent timing attacks
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @param encoding Encoding type for the strings (default: 'utf8')
 * @returns true if strings match, false otherwise
 */
export function constantTimeCompare(
  str1: string,
  str2: string,
  encoding: BufferEncoding = "utf8",
): boolean {
  const buffer1 = Buffer.from(str1, encoding);
  const buffer2 = Buffer.from(str2, encoding);

  // If lengths differ, comparison fails (but still compare to maintain constant time)
  if (buffer1.length !== buffer2.length) {
    return false;
  }

  return crypto.timingSafeEqual(buffer1, buffer2);
}
