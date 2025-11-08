import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { ErrorCode, ErrorMessages } from "../constants/errorCodes";
import { resetCodes, users } from "../db/schema";
import type { User } from "../types/user";
import { safeStringCompare } from "../utils/crypto";

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
export async function createUser(email: string, password: string): Promise<User> {
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new ServiceError(ErrorCode.USER_ALREADY_EXISTS);
  }

  const hashedPassword = hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
    })
    .returning();

  if (!newUser) {
    throw new ServiceError(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to create user");
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

  if (!user) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Verify user credentials and return user if valid
 */
export async function loginUser(email: string, password: string): Promise<User> {
  const hashedPassword = hashPassword(password);

  // Find user by email
  const [matchedUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!matchedUser) {
    // User not found - throw error
    throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
  }

  // Use constant-time comparison to prevent timing attacks
  if (safeStringCompare(matchedUser.password, hashedPassword, "hex")) {
    const { password: _, ...userWithoutPassword } = matchedUser;
    return userWithoutPassword;
  }

  // Password doesn't match - throw error
  throw new ServiceError(ErrorCode.INVALID_CREDENTIALS);
}

/**
 * Send reset password code
 */
export async function sendResetCode(email: string): Promise<{ code: string; expiresAt: Date }> {
  // Check if user exists
  const user = await getUserByEmail(email);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  const code = generateResetCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code expires in 15 minutes

  // Delete any existing reset code for this email
  await db.delete(resetCodes).where(eq(resetCodes.email, email));

  // Insert new reset code
  await db.insert(resetCodes).values({
    email,
    code,
    expiresAt: expiresAt.toISOString(),
  });

  // In production, this would send an email
  // WARNING: Logging reset codes is a security vulnerability. Remove in production.
  console.log(`Reset code for ${email}: ${code}`);

  return { code, expiresAt };
}

/**
 * Reset password using code
 */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  // Check if user exists
  const user = await getUserByEmail(email);
  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // Check if reset code exists
  const [resetData] = await db
    .select()
    .from(resetCodes)
    .where(eq(resetCodes.email, email))
    .limit(1);

  if (!resetData) {
    throw new ServiceError(ErrorCode.RESET_CODE_NOT_FOUND);
  }

  // Check if code matches (constant-time comparison)
  if (!safeStringCompare(resetData.code, code)) {
    throw new ServiceError(ErrorCode.INVALID_RESET_CODE);
  }

  // Check if code has expired
  if (new Date() > new Date(resetData.expiresAt)) {
    await db.delete(resetCodes).where(eq(resetCodes.email, email));
    throw new ServiceError(ErrorCode.RESET_CODE_EXPIRED);
  }

  // Update user password
  await db
    .update(users)
    .set({
      password: hashPassword(newPassword),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.email, email));

  // Delete used reset code
  await db.delete(resetCodes).where(eq(resetCodes.email, email));
}

/**
 * Delete user by ID
 */
export async function deleteUser(userId: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // Delete user
  await db.delete(users).where(eq(users.userId, userId));

  // Also delete any reset codes for this user
  await db.delete(resetCodes).where(eq(resetCodes.email, user.email));
}

/**
 * Update user data
 */
export async function updateUser(
  userId: string,
  updates: { email?: string; password?: string },
): Promise<User> {
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

  if (!user) {
    throw new ServiceError(ErrorCode.USER_NOT_FOUND);
  }

  // If updating email, check if new email is already in use
  if (updates.email && updates.email !== user.email) {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, updates.email))
      .limit(1);

    if (existingUser) {
      throw new ServiceError(ErrorCode.EMAIL_ALREADY_IN_USE);
    }
  }

  // Prepare update data
  const updateData: { email?: string; password?: string; updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.email) {
    updateData.email = updates.email;
  }

  if (updates.password) {
    updateData.password = hashPassword(updates.password);
  }

  // Update user
  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.userId, userId))
    .returning();

  if (!updatedUser) {
    throw new ServiceError(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to update user");
  }

  const { password: _, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
}
