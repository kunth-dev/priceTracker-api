export interface IEmailService {
  sendVerificationEmail(email: string, code: string): Promise<void>;
  sendPasswordResetEmail(email: string, code: string): Promise<void>;
}
