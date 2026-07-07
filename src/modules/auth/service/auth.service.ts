import jwt from "jsonwebtoken";

import { userService } from "../../user/service/user.service";
import {
  signAccessToken,
  signRefreshToken,
  JwtPayload,
} from "../../common/auth/jwt";
import { env } from "../../../config/env";
import { LoginInput, UpdateProfileInput } from "../schema/auth.schema";
import { logger } from "../../common/logger/logger";
import { invalidateUserCache } from "../../../middleware/auth.middleware";
import { redisService } from "../../redis/service/redis.service";
import { isSystemAdminEmail } from "../../../utils/auth/system-admin.utils";
import { verificationTokenService } from "./verification-token.service";
import { eventBus } from "../../common/messaging/event-bus";
import { UserPasswordResetRequestedEvent } from "../../user/events/user-password-reset-requested.event";
import { UserPasswordChangedEvent } from "../../user/events/user-password-changed.event";

const GENERIC_RESEND_MESSAGE = "If that account exists and needs verification, a new link has been sent.";
const GENERIC_FORGOT_PASSWORD_MESSAGE = "If that account exists, a password reset link has been sent.";

// Must cover the longest possible refresh token lifetime (remember-me), not just the default,
// otherwise a revoked remember-me token could become valid again once this marker expires.
const REFRESH_TOKEN_TTL_SECONDS = 60 * 24 * 60 * 60; // 60 days, matches REFRESH_TOKEN_TTL_REMEMBER_ME
const REVOKED_REFRESH_PREFIX = "refresh:revoked:";

export class AuthService {
  async login(data: LoginInput) {
    const { email, password, rememberMe } = data;

    const user = await userService.validateUser(email, password);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.emailVerifiedAt) {
      throw new Error("Email not verified");
    }

    const payload: JwtPayload = { sub: user._id.toString(), role: user.role, rememberMe };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload, rememberMe);

    if (env.NODE_ENV === "development") {
      logger.info("Dev login token issued", {
        userId: user._id.toString(),
      });
    }

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: isSystemAdminEmail(user.email) ? "admin" : user.role,
        avatarUrl: user.avatarKey ? `/api/users/${user._id.toString()}/avatar` : null,
        bio: user.bio ?? null,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as JwtPayload & { iat?: number };

    const revokedAt = await redisService.get<number>(REVOKED_REFRESH_PREFIX + payload.sub);
    if (revokedAt && payload.iat && payload.iat <= revokedAt) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findById(payload.sub);
    if (!user) {
      throw new Error("User not found");
    }

    const newPayload: JwtPayload = { sub: user._id.toString(), role: user.role, rememberMe: payload.rememberMe };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload, payload.rememberMe);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await redisService.set(
      REVOKED_REFRESH_PREFIX + userId,
      Math.floor(Date.now() / 1000),
      REFRESH_TOKEN_TTL_SECONDS
    );

    return { message: "Logged out successfully" };
  }

  async getCurrentUser(userId: string) {
    const user = await userService.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: isSystemAdminEmail(user.email) ? "admin" : user.role,
      avatarUrl: user.avatarKey ? `/api/users/${user._id.toString()}/avatar` : null,
      bio: user.bio ?? null,
      createdAt: user.createdAt,
    };
  }

  async deleteCurrentUser(userId: string) {
    const deletedUser = await userService.deleteById(userId);
    if (!deletedUser) {
      throw new Error("User not found");
    }

    await invalidateUserCache(userId);

    logger.info("User deleted", { userId });

    return {
      message: "Account deleted successfully",
    };
  }

  async updateProfile(userId: string, updates: UpdateProfileInput) {
    const user = await userService.updateProfile(userId, updates);
    await invalidateUserCache(userId);

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: isSystemAdminEmail(user.email) ? "admin" : user.role,
      avatarUrl: user.avatarKey ? `/api/users/${user._id.toString()}/avatar` : null,
      bio: user.bio ?? null,
      createdAt: user.createdAt,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userService.changePassword(userId, currentPassword, newPassword);
    await invalidateUserCache(userId);

    await this.publishPasswordChanged(user, false);

    return { message: "Password changed successfully" };
  }

  async verifyEmail(token: string) {
    const userId = await verificationTokenService.consumeEmailVerificationToken(token);
    if (!userId) {
      throw new Error("Invalid or expired verification link");
    }

    const user = await userService.markEmailVerified(userId);
    if (!user) {
      throw new Error("Invalid or expired verification link");
    }

    await invalidateUserCache(userId);

    return { message: "Email verified successfully" };
  }

  // Always returns the same message regardless of whether the account exists, is already
  // verified, or is on cooldown - avoids leaking account existence to a caller probing emails.
  async resendVerification(email: string) {
    const user = await userService.findByEmail(email);

    if (user && !user.emailVerifiedAt) {
      const onCooldown = await verificationTokenService.isEmailVerificationOnCooldown(user._id.toString());
      if (!onCooldown) {
        await userService.issueEmailVerificationResend(user);
      }
    }

    return { message: GENERIC_RESEND_MESSAGE };
  }

  // Same enumeration-avoidance reasoning as resendVerification, and matters more here.
  async forgotPassword(email: string) {
    const user = await userService.findByEmail(email);

    if (user) {
      try {
        const token = await verificationTokenService.issuePasswordResetToken(user._id.toString());

        await eventBus.publish(
          new UserPasswordResetRequestedEvent(user._id.toString(), {
            email: user.email,
            name: user.name,
            token,
          })
        );
      } catch (error) {
        logger.error("Failed to send password reset email", {
          userId: user._id.toString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await verificationTokenService.consumePasswordResetToken(token);
    if (!userId) {
      throw new Error("Invalid or expired reset link");
    }

    const user = await userService.resetPassword(userId, newPassword);
    await invalidateUserCache(userId);

    // A stolen session must not outlive a reset - revoke every refresh token issued before now,
    // same marker logout() uses.
    await redisService.set(
      REVOKED_REFRESH_PREFIX + userId,
      Math.floor(Date.now() / 1000),
      REFRESH_TOKEN_TTL_SECONDS
    );

    await this.publishPasswordChanged(user, true);

    return { message: "Password reset successfully" };
  }

  private async publishPasswordChanged(user: { _id: unknown; email: string; name: string }, sessionsRevoked: boolean) {
    try {
      await eventBus.publish(
        new UserPasswordChangedEvent(String(user._id), {
          email: user.email,
          name: user.name,
          sessionsRevoked,
        })
      );
    } catch (error) {
      logger.error("Failed to send password-changed notice", {
        userId: String(user._id),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const authService = new AuthService();
