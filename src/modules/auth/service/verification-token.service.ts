import crypto from "crypto";

import { redisService } from "../../redis/service/redis.service";

const EMAIL_VERIFY_PREFIX = "email-verify:";
const EMAIL_VERIFY_COOLDOWN_PREFIX = "email-verify-cooldown:";
const PASSWORD_RESET_PREFIX = "password-reset:";

const EMAIL_VERIFY_TTL_SECONDS = 24 * 60 * 60;
const PASSWORD_RESET_TTL_SECONDS = 60 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

type TokenRecord = { userId: string };

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Redis-backed, hashed, single-use tokens for the email-verification and password-reset
 * links. Only the SHA-256 hash of the token is ever stored - the raw token (sent in the
 * email link) has 256 bits of entropy, so unguessability comes from that, not from keeping
 * the hash function secret. TTL is native to Redis, no cleanup job needed.
 */
export class VerificationTokenService {
  async issueEmailVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    await redisService.set(EMAIL_VERIFY_PREFIX + hashToken(token), { userId } satisfies TokenRecord, EMAIL_VERIFY_TTL_SECONDS);
    await redisService.set(EMAIL_VERIFY_COOLDOWN_PREFIX + userId, true, RESEND_COOLDOWN_SECONDS);
    return token;
  }

  async isEmailVerificationOnCooldown(userId: string): Promise<boolean> {
    return (await redisService.get(EMAIL_VERIFY_COOLDOWN_PREFIX + userId)) !== null;
  }

  async consumeEmailVerificationToken(token: string): Promise<string | null> {
    const record = await redisService.getDel<TokenRecord>(EMAIL_VERIFY_PREFIX + hashToken(token));
    return record?.userId ?? null;
  }

  async issuePasswordResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    await redisService.set(PASSWORD_RESET_PREFIX + hashToken(token), { userId } satisfies TokenRecord, PASSWORD_RESET_TTL_SECONDS);
    return token;
  }

  async consumePasswordResetToken(token: string): Promise<string | null> {
    const record = await redisService.getDel<TokenRecord>(PASSWORD_RESET_PREFIX + hashToken(token));
    return record?.userId ?? null;
  }
}

export const verificationTokenService = new VerificationTokenService();
