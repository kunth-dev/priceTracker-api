import crypto from "node:crypto";
import { ErrorCode, ErrorMessages } from "../constants/errorCodes";
import type { User } from "../types/user";

// Custom error class that includes error code
class ServiceError extends Error {
  constructor(
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super(message || ErrorMessages[errorCode]);
    this.name = "ServiceError";
  }
}

// In-memory storage for users and reset codes
const users = new Map<string, User & { password: string }>();
const resetCodes = new Map<string, { code: string; expiresAt: Date }>();

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a random 6-digit reset code using crypto.randomInt
 */
function generateResetCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash a password using SHA-256 (for demo purposes - in production use bcrypt, scrypt, or Argon2)
 * WARNING: SHA-256 is NOT secure for password hashing as it's designed for speed.
 * It's vulnerable to brute force attacks. This is only for demonstration.
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Create a new user
 */
export function createUser(email: string, password: string): User {
  // Check if user already exists using some
  const userExists = Array.from(users.values()).some((user) => user.email === email);
  if (userExists) {
    throw new ServiceError(ErrorCode.USER_ALREADY_EXISTS);
  }

  const userId = generateUserId();
  const now = new Date().toISOString();
  const hashedPassword = hashPassword(password);

  const user: User & { password: string } = {
    userId,
    email,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  };

  users.set(userId, user);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | null {
  const user = users.get(userId);
  if (!user) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const matchedUser = Array.from(users.values()).find((user) => user.email === email);

  if (!matchedUser) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = matchedUser;
  return userWithoutPassword;
}

/**
 * Verify user credentials and return user if valid
 */
export function loginUser(email: string, password: string): User {
  const hashedPassword = hashPassword(password);

  // Find user by email using find
  const matchedUser = Array.from(users.values()).find((user) => user.email === email);

  if (!matchedUser) {
    // User not found - throw error
    throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
  }

  if (matchedUser.password === hashedPassword) {
    const { password: _, ...userWithoutPassword } = matchedUser;
    return userWithoutPassword;
  }

  // Password doesn't match - throw error
  throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
}

/**
 * Send reset password code
 */
export function sendResetCode(email: string): { code: string; expiresAt: Date } {
  // Check if user exists
  const user = getUserByEmail(email);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  const code = generateResetCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code expires in 15 minutes

  resetCodes.set(email, { code, expiresAt });

  // In production, this would send an email
  // WARNING: Logging reset codes is a security vulnerability. Remove in production.
  console.log(`Reset code for ${email}: ${code}`);

  return { code, expiresAt };
}

/**
 * Reset password using code
 */
export function resetPassword(email: string, code: string, newPassword: string): void {
  // Check if user exists
  const user = getUserByEmail(email);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // Check if reset code exists
  const resetData = resetCodes.get(email);
  if (!resetData) {
    throw new ServiceError(ErrorCode.RESET_CODE_NOT_FOUND);
  }

  // Check if code matches
  if (resetData.code !== code) {
    throw new ServiceError(ErrorCode.INVALID_RESET_CODE);
  }

  // Check if code has expired
  if (new Date() > resetData.expiresAt) {
    resetCodes.delete(email);
    throw new ServiceError(ErrorCode.RESET_CODE_EXPIRED);
  }

  // Find user in storage and update password using find
  const userEntry = Array.from(users.entries()).find(([_, u]) => u.email === email);

  if (userEntry) {
    const [userId, storedUser] = userEntry;
    storedUser.password = hashPassword(newPassword);
    storedUser.updatedAt = new Date().toISOString();
    users.set(userId, storedUser);
  }

  // Delete used reset code
  resetCodes.delete(email);
}

/**
 * Delete user by ID
 */
export function deleteUser(userId: string): void {
  const user = users.get(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  users.delete(userId);
  // Also delete any reset codes for this user
  resetCodes.delete(user.email);
}

/**
 * Update user data
 */
export function updateUser(userId: string, updates: { email?: string; password?: string }): User {
  const user = users.get(userId);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // If updating email, check if new email is already in use using some
  if (updates.email && updates.email !== user.email) {
    const emailInUse = Array.from(users.values()).some(
      (existingUser) => existingUser.email === updates.email,
    );

    if (emailInUse) {
      throw new ServiceError(ErrorCode.EMAIL_ALREADY_IN_USE);
    }

    user.email = updates.email;
  }

  // If updating password, hash it
  if (updates.password) {
    user.password = hashPassword(updates.password);
  }

  user.updatedAt = new Date().toISOString();
  users.set(userId, user);

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
