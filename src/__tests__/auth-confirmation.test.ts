import request from "supertest";
import { eq } from "drizzle-orm";
import { db } from "../config/database";
import { confirmationTokens, users } from "../db/schema";
import app from "../app";

describe("Auth Confirmation Endpoints", () => {
  const testEmail = "test-confirmation@example.com";
  const testPassword = "password123";

  // Clean up before and after tests
  beforeEach(async () => {
    // Delete test user and related records if they exist
    await db.delete(confirmationTokens).where(eq(confirmationTokens.email, testEmail));
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterEach(async () => {
    // Clean up after tests
    await db.delete(confirmationTokens).where(eq(confirmationTokens.email, testEmail));
    await db.delete(users).where(eq(users.email, testEmail));
  });

  describe("POST /api/auth/register", () => {
    it("should create user and send confirmation email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User created successfully");
      expect(response.body.data.email).toBe(testEmail);
      expect(response.body.data.userId).toBeDefined();

      // Verify confirmation token was created
      const [token] = await db
        .select()
        .from(confirmationTokens)
        .where(eq(confirmationTokens.email, testEmail))
        .limit(1);

      expect(token).toBeDefined();
      expect(token.email).toBe(testEmail);
      expect(token.token).toBeDefined();
    });
  });

  describe("POST /api/auth/register-confirmation", () => {
    it("should confirm account with valid token", async () => {
      // First create a user
      await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      // Get the confirmation token
      const [tokenRecord] = await db
        .select()
        .from(confirmationTokens)
        .where(eq(confirmationTokens.email, testEmail))
        .limit(1);

      expect(tokenRecord).toBeDefined();

      // Confirm the account
      const response = await request(app)
        .post("/api/auth/register-confirmation")
        .send({
          uuid: tokenRecord.token,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Account confirmed successfully");

      // Verify token was deleted (can only be used once)
      const [deletedToken] = await db
        .select()
        .from(confirmationTokens)
        .where(eq(confirmationTokens.email, testEmail))
        .limit(1);

      expect(deletedToken).toBeUndefined();
    });

    it("should return 404 for invalid token", async () => {
      const response = await request(app)
        .post("/api/auth/register-confirmation")
        .send({
          uuid: "00000000-0000-0000-0000-000000000000",
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("CONFIRMATION_TOKEN_NOT_FOUND");
    });

    it("should return 400 for invalid UUID format", async () => {
      const response = await request(app)
        .post("/api/auth/register-confirmation")
        .send({
          uuid: "invalid-uuid",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("VALIDATION_FAILED");
    });

    it("should not allow using token twice", async () => {
      // Create a user
      await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      // Get the confirmation token
      const [tokenRecord] = await db
        .select()
        .from(confirmationTokens)
        .where(eq(confirmationTokens.email, testEmail))
        .limit(1);

      // Use token first time
      await request(app)
        .post("/api/auth/register-confirmation")
        .send({
          uuid: tokenRecord.token,
        })
        .expect(200);

      // Try to use token second time
      const response = await request(app)
        .post("/api/auth/register-confirmation")
        .send({
          uuid: tokenRecord.token,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("CONFIRMATION_TOKEN_NOT_FOUND");
    });
  });

  describe("POST /api/auth/resend-confirmation-email", () => {
    it("should resend confirmation email for existing user", async () => {
      // First create a user
      await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      // Get the initial token
      const [initialToken] = await db
        .select()
        .from(confirmationTokens)
        .where(eq(confirmationTokens.email, testEmail))
        .limit(1);

      expect(initialToken).toBeDefined();

      // Resend confirmation email
      const response = await request(app)
        .post("/api/auth/resend-confirmation-email")
        .send({
          email: testEmail,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Confirmation email sent successfully");

      // Verify a new token was created
      const [newToken] = await db
        .select()
        .from(confirmationTokens)
        .where(eq(confirmationTokens.email, testEmail))
        .limit(1);

      expect(newToken).toBeDefined();
      // Token should be different
      expect(newToken.token).not.toBe(initialToken.token);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/resend-confirmation-email")
        .send({
          email: "nonexistent@example.com",
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("USER_NOT_FOUND");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/resend-confirmation-email")
        .send({
          email: "invalid-email",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("VALIDATION_FAILED");
    });
  });
});
