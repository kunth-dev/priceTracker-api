import crypto from "node:crypto";
import type { User } from "../types/user";

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
 * Generate a random 6-digit reset code
 */
function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash a password using SHA-256 (for demo purposes - in production use bcrypt)
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Create a new user
 */
export function createUser(email: string, password: string): User {
  // Check if user already exists
  for (const user of users.values()) {
    if (user.email === email) {
      throw new Error("User with this email already exists");
    }
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
  for (const user of users.values()) {
    if (user.email === email) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
  }
  return null;
}

/**
 * Send reset password code
 */
export function sendResetCode(email: string): { code: string; expiresAt: Date } {
  // Check if user exists
  const user = getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  const code = generateResetCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code expires in 15 minutes

  resetCodes.set(email, { code, expiresAt });

  // In production, this would send an email
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
    throw new Error("User not found");
  }

  // Check if reset code exists
  const resetData = resetCodes.get(email);
  if (!resetData) {
    throw new Error("No reset code found for this email");
  }

  // Check if code matches
  if (resetData.code !== code) {
    throw new Error("Invalid reset code");
  }

  // Check if code has expired
  if (new Date() > resetData.expiresAt) {
    resetCodes.delete(email);
    throw new Error("Reset code has expired");
  }

  // Find user in storage and update password
  for (const [userId, storedUser] of users.entries()) {
    if (storedUser.email === email) {
      storedUser.password = hashPassword(newPassword);
      storedUser.updatedAt = new Date().toISOString();
      users.set(userId, storedUser);
      break;
    }
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
    throw new Error("User not found");
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
    throw new Error("User not found");
  }

  // If updating email, check if new email is already in use
  if (updates.email && updates.email !== user.email) {
    for (const existingUser of users.values()) {
      if (existingUser.email === updates.email) {
        throw new Error("Email already in use");
      }
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
