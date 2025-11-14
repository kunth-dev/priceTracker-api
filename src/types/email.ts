export interface IEmailService {
  sendVerificationEmail(email: string, code: string): Promise<void>;
  sendPasswordResetEmail(email: string, code: string): Promise<void>;
  sendConfirmationEmail(email: string, token: string): Promise<void>;
}
