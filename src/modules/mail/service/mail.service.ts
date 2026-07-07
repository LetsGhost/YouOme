import { env } from "../../../config/env";
import { logger } from "../../common/logger/logger";
import { sendEmail } from "../client/email-service.client";
import { verifyEmailTemplate } from "../templates/verifyEmail.template";
import { resetPasswordTemplate } from "../templates/resetPassword.template";
import { passwordChangedTemplate } from "../templates/passwordChanged.template";
import { notificationTemplate } from "../templates/notification.template";

type MailRecipient = {
  email: string;
  name: string;
};

type NotifiableRecipient = MailRecipient & {
  emailNotificationsEnabled: boolean;
};

/**
 * The one entry point other modules should call to send email. Wraps the email-service
 * HTTP client with our templates and logs-but-doesn't-throw for non-critical sends, so a
 * flaky mail provider never blocks registration/forgot-password/etc.
 *
 * emailNotificationsEnabled only gates sendNotificationEmail() (social/activity email) -
 * verification, password reset, and security notices are account-critical and always sent.
 */
export class MailService {
  async sendVerificationEmail(user: MailRecipient, token: string): Promise<void> {
    const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;

    if (env.NODE_ENV === "development") {
      logger.info("Dev verification link issued", { email: user.email, verifyUrl });
    }

    await this.send(user.email, verifyEmailTemplate({ name: user.name, verifyUrl }));
  }

  async sendPasswordResetEmail(user: MailRecipient, token: string): Promise<void> {
    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;

    if (env.NODE_ENV === "development") {
      logger.info("Dev password reset link issued", { email: user.email, resetUrl });
    }

    await this.send(user.email, resetPasswordTemplate({ name: user.name, resetUrl }));
  }

  async sendPasswordChangedNotice(user: MailRecipient, sessionsRevoked: boolean): Promise<void> {
    await this.send(user.email, passwordChangedTemplate({ name: user.name, sessionsRevoked }));
  }

  async sendNotificationEmail(
    user: NotifiableRecipient,
    input: { heading: string; message: string; actionUrl?: string; actionLabel?: string }
  ): Promise<void> {
    if (!user.emailNotificationsEnabled) {
      return;
    }

    await this.send(user.email, notificationTemplate(input));
  }

  private async send(to: string, content: { subject: string; html: string; text: string }): Promise<void> {
    try {
      await sendEmail({ to, ...content });
    } catch (error) {
      logger.error("Failed to send email", {
        to,
        subject: content.subject,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const mailService = new MailService();
