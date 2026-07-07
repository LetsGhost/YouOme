import { env } from "../../../config/env";
import { logger } from "../../common/logger/logger";

export class EmailDeliveryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Thin client for ../../email-service's POST /emails/send. That service is deliberately dumb
 * (no templating, no queue/retry) - this is the entire integration surface with it.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.EMAIL_SERVICE_URL}/emails/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": env.EMAIL_SERVICE_API_KEY,
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new EmailDeliveryError(`email-service responded with ${response.status}: ${body}`);
    }

    const result = (await response.json().catch(() => null)) as { status?: string } | null;
    if (result?.status === "logged") {
      logger.info("Email sent in dry-run mode (logged only, not actually delivered)", {
        to: input.to,
        subject: input.subject,
      });
    }
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      throw error;
    }
    throw new EmailDeliveryError("Failed to reach email-service", error);
  } finally {
    clearTimeout(timeout);
  }
}
