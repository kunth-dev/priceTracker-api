import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";
import logger from "../config/logger";
import type { IEmailService } from "../types/email";

/**
 * Email service implementation using nodemailer
 * Follows singleton pattern to ensure single transporter instance
 */
class EmailService implements IEmailService {
  private static instance: EmailService | null = null;
  private transporter: Transporter | null = null;

  private constructor() {
    this.initializeTransporter();
  }

  /**
   * Get singleton instance of EmailService
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize the email transporter with SMTP configuration
   */
  private initializeTransporter(): void {
    // Check if SMTP is configured
    if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_MAIL || !env.SMTP_APP_PASS) {
      logger.warn(
        "SMTP configuration is incomplete. Email sending will be disabled. " +
          "Please configure SMTP_HOST, SMTP_PORT, SMTP_MAIL, and SMTP_APP_PASS environment variables.",
      );
      return;
    }

    try {
      const isSecure = env.SMTP_PORT === 465;

      // Create transporter with SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: isSecure, // true for 465, false for other ports
        auth: {
          user: env.SMTP_MAIL,
          pass: env.SMTP_APP_PASS,
        },
        // TLS configuration for production environments
        tls: {
          // Allow self-signed certificates in production environments
          rejectUnauthorized: false,
          // Minimum TLS version
          minVersion: "TLSv1.2",
          // Ciphers to use
          ciphers: "SSLv3",
        },
        // Increase timeout configurations for production network conditions
        connectionTimeout: 60000, // 60 seconds for initial connection
        greetingTimeout: 30000, // 30 seconds for greeting after connection
        socketTimeout: 60000, // 60 seconds for socket inactivity timeout
        // Enable debug mode in development
        debug: env.NODE_ENV === "development",
        logger: env.NODE_ENV === "development",
      });

      logger.info("Email transporter initialized successfully", {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: isSecure,
      });

      // Verify connection configuration (async, non-blocking)
      // Wait a bit for container network to be fully initialized
      setTimeout(() => this.verifyConnection(), 5000);
    } catch (error) {
      logger.error("Failed to initialize email transporter", { error });
      this.transporter = null;
    }
  }

  /**
   * Verify SMTP connection (async, doesn't block initialization)
   * This is informational only and won't prevent email sending attempts
   */
  private async verifyConnection(): Promise<void> {
    if (!this.transporter) {
      return;
    }

    try {
      await this.transporter.verify();
      logger.info("SMTP connection verified successfully");
    } catch (error) {
      // In production, log as warning instead of error
      // The container might not have network access yet during startup
      const logLevel = env.NODE_ENV === "production" ? "warn" : "error";
      logger[logLevel]("SMTP connection verification failed", { error });
      logger.info(
        "SMTP verification failed, but email sending will still be attempted with retry logic.",
      );
    }
  }

  /**
   * Send email with retry logic
   */
  private async sendMailWithRetry(
    mailOptions: object,
    maxRetries = 3,
    retryDelay = 2000,
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error("Email transporter not initialized");
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.transporter.sendMail(mailOptions);
        return; // Success
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Email send attempt ${attempt}/${maxRetries} failed`, {
          error,
          willRetry: attempt < maxRetries,
        });

        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    // All retries failed
    throw lastError;
  }

  /**
   * Send verification code email
   */
  public async sendVerificationEmail(email: string, code: string): Promise<void> {
    if (!this.transporter) {
      // Fallback to console log when SMTP is not configured
      logger.warn(`Email sending is disabled. Verification code for ${email}: ${code}`);
      console.log(`Verification code for ${email}: ${code}`);
      return;
    }

    try {
      const mailOptions = {
        from: `"Price Tracker" <${env.SMTP_MAIL}>`,
        to: email,
        subject: "Email Verification Code",
        text: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this code, please ignore this email.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email.</p>
        </div>
      `,
      };

      await this.sendMailWithRetry(mailOptions);
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}`, { error });
      // Fallback to console log on error - don't throw to allow operation to complete
      console.log(`Verification code for ${email}: ${code}`);
    }
  }

  /**
   * Send password reset code email
   */
  public async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    if (!this.transporter) {
      // Fallback to console log when SMTP is not configured
      logger.warn(`Email sending is disabled. Reset code for ${email}: ${code}`);
      console.log(`Reset code for ${email}: ${code}`);
      return;
    }

    try {
      const mailOptions = {
        from: `"Price Tracker" <${env.SMTP_MAIL}>`,
        to: email,
        subject: "Password Reset Code",
        text: `Your password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this code, please ignore this email and your password will remain unchanged.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>Your password reset code is:</p>
          <h1 style="color: #FF5722; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email and your password will remain unchanged.</p>
        </div>
      `,
      };

      await this.sendMailWithRetry(mailOptions);
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}`, { error });
      // Fallback to console log on error - don't throw to allow operation to complete
      console.log(`Reset code for ${email}: ${code}`);
    }
  }

  /**
   * Send confirmation email with link
   */
  public async sendConfirmationEmail(email: string, token: string): Promise<void> {
    const confirmationLink = `${env.APP_DOMAIN}/register/confirmation?uuid=${token}`;

    if (!this.transporter) {
      // Fallback to console log when SMTP is not configured
      logger.warn(`Email sending is disabled. Confirmation token for ${email}: ${token}`);
      console.log(`Confirmation link for ${email}: ${confirmationLink}`);
      return;
    }

    try {
      const mailOptions = {
        from: `"Price Tracker" <${env.SMTP_MAIL}>`,
        to: email,
        subject: "Confirm Your Email Address",
        text: `Please confirm your email address by clicking the link below:\n\n${confirmationLink}\n\nThis link can only be used once.\n\nIf you did not create an account, please ignore this email.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Confirm Your Email Address</h2>
          <p>Thank you for registering! Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Confirm Email</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #4CAF50; word-break: break-all;">${confirmationLink}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">This link can only be used once. If you did not create an account, please ignore this email.</p>
        </div>
      `,
      };

      await this.sendMailWithRetry(mailOptions);
      logger.info(`Confirmation email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send confirmation email to ${email}`, { error });
      // Fallback to console log on error - don't throw to allow registration to complete
      console.log(`Confirmation link for ${email}: ${confirmationLink}`);
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
