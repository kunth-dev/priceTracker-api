import { eq } from "drizzle-orm";
import request from "supertest";
import app from "../app";
import { db } from "../config/database";
import { confirmationTokens, resetCodes, users } from "../db/schema";

describe("Account Verification Requirements", () => {
  const testEmail = "test-verification@example.com";
  const testPassword = "password123";

  // Clean up before and after tests
  beforeEach(async () => {
    await db.delete(resetCodes).where(eq(resetCodes.email, testEmail));
    await db.delete(confirmationTokens).where(eq(confirmationTokens.email, testEmail));
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterEach(async () => {
    await db.delete(resetCodes).where(eq(resetCodes.email, testEmail));
    await db.delete(confirmationTokens).where(eq(confirmationTokens.email, testEmail));
    await db.delete(users).where(eq(users.email, testEmail));
  });

  describe("Login Prevention for Unverified Accounts", () => {
    it("should prevent login for unverified account", async () => {
      // Create a user (unverified by default)
      await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      // Attempt to login with unverified account
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("ACCOUNT_NOT_VERIFIED");
      expect(response.body.message).toContain("Account is not verified");
    });

    it("should allow login after account verification via token", async () => {
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

      expect(tokenRecord).toBeDefined();

      // Confirm the account
      await request(app)
        .post("/api/auth/register-confirmation")
        .send({
          uuid: tokenRecord.token,
        })
        .expect(200);

      // Now login should succeed
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.data.email).toBe(testEmail);
      expect(response.body.data.verified).toBe(true);
    });
  });

  describe("Password Reset Prevention for Unverified Accounts", () => {
    it("should prevent password reset request for unverified account via send-reset-code", async () => {
      // Create a user (unverified by default)
      await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      // Attempt to request password reset with unverified account
      const response = await request(app)
        .post("/api/auth/send-reset-code")
        .send({
          email: testEmail,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("ACCOUNT_NOT_VERIFIED");
      expect(response.body.message).toContain("Account is not verified");
    });

    it("should prevent password reset request for unverified account via forgot-password", async () => {
      // Create a user (unverified by default)
      await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      // Attempt to request password reset with unverified account
      const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({
          email: testEmail,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe("ACCOUNT_NOT_VERIFIED");
      expect(response.body.message).toContain("Account is not verified");
    });

    it("should allow password reset request after account verification", async () => {
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

      // Confirm the account
      await request(app)
        .post("/api/auth/register-confirmation")
        .send({
          uuid: tokenRecord.token,
        })
        .expect(200);

      // Now password reset request should succeed
      const response = await request(app)
        .post("/api/auth/send-reset-code")
        .send({
          email: testEmail,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Reset code sent to email");
      expect(response.body.data.expiresAt).toBeDefined();
    });
  });

  describe("Verified Status Updates", () => {
    it("should set verified to true after confirmation token is used", async () => {
      // Create a user
      await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      // Verify user is not verified initially
      const [userBefore] = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
      expect(userBefore.verified).toBe(false);

      // Get the confirmation token
      const [tokenRecord] = await db
        .select()
        .from(confirmationTokens)
        .where(eq(confirmationTokens.email, testEmail))
        .limit(1);

      // Confirm the account
      await request(app)
        .post("/api/auth/register-confirmation")
        .send({
          uuid: tokenRecord.token,
        })
        .expect(200);

      // Verify user is now verified
      const [userAfter] = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
      expect(userAfter.verified).toBe(true);
    });
  });
});
