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
    if (!env.SMPT_HOST || !env.SMPT_PORT || !env.SMPT_MAIL || !env.SMPT_APP_PASS) {
      logger.warn(
        "SMTP configuration is incomplete. Email sending will be disabled. " +
          "Please configure SMPT_HOST, SMPT_PORT, SMPT_MAIL, and SMPT_APP_PASS environment variables.",
      );
      return;
    }

    try {
      // Create transporter with SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: env.SMPT_HOST,
        port: env.SMPT_PORT,
        secure: env.SMPT_PORT === 465, // true for 465, false for other ports
        auth: {
          user: env.SMPT_MAIL,
          pass: env.SMPT_APP_PASS,
        },
        ...(env.SMPT_SERVICE && { service: env.SMPT_SERVICE }),
      });

      logger.info("Email transporter initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize email transporter", { error });
      this.transporter = null;
    }
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
        from: `"Price Tracker" <${env.SMPT_MAIL}>`,
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

      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}`, { error });
      // Fallback to console log on error
      console.log(`Verification code for ${email}: ${code}`);
      throw new Error("Failed to send verification email");
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
        from: `"Price Tracker" <${env.SMPT_MAIL}>`,
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

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}`, { error });
      // Fallback to console log on error
      console.log(`Reset code for ${email}: ${code}`);
      throw new Error("Failed to send password reset email");
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
