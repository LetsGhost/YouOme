import crypto from "crypto";
import bcrypt from "bcrypt";
import { HydratedDocument } from "mongoose";

import { BaseService } from "../../common/base/base.service";
import { UserModel } from "../model/user.model";
import { UserEntity } from "../entity/user.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { logger } from "../../common/logger/logger";
import { UserCreatedEvent } from "../events/user-created.event";
import { UserEmailVerificationRequestedEvent } from "../events/user-email-verification-requested.event";
import { env } from "../../../config/env";

const EMAIL_VERIFICATION_CODE_TTL_MS = 30 * 60 * 1000;
const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;

export class UserService extends BaseService<UserEntity> {
  constructor() {
    super(UserModel);
  }

  private generateEmailVerificationCode() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  private hashEmailVerificationCode(code: string) {
    return crypto.createHmac("sha256", env.EMAIL_TOKEN_SECRET).update(code).digest("hex");
  }

  private getEmailVerificationExpiresAt() {
    return new Date(Date.now() + EMAIL_VERIFICATION_CODE_TTL_MS);
  }

  private async publishEmailVerificationRequested(
    user: HydratedDocument<UserEntity>,
    code: string
  ) {
    await eventBus.publish(
      new UserEmailVerificationRequestedEvent(user._id.toString(), {
        email: user.email,
        name: user.name,
        code,
      })
    );
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email });
  }

  async createUser(
    email: string,
    password: string,
    name?: string,
    options?: { verified?: boolean }
  ) {
    if (await this.model.exists({ email })) {
      throw new Error("Email already exists");
    }

    const displayName = name && name.trim().length > 0 ? name.trim() : email.split("@")[0];
    const shouldSkipVerification = options?.verified === true;
    const verificationCode = shouldSkipVerification ? null : this.generateEmailVerificationCode();

    const user = await this.create({
      email,
      password: await bcrypt.hash(password, 10),
      name: displayName,
      emailVerifiedAt: shouldSkipVerification ? new Date() : undefined,
      emailVerificationCodeHash: verificationCode ? this.hashEmailVerificationCode(verificationCode) : undefined,
      emailVerificationCodeExpiresAt: verificationCode ? this.getEmailVerificationExpiresAt() : undefined,
      emailVerificationLastSentAt: verificationCode ? new Date() : undefined,
    });

    // Emit domain event
    const event = new UserCreatedEvent(user._id.toString(), {
      email: user.email,
      role: user.role,
    });
    await eventBus.publish(event);

    if (verificationCode) {
      try {
        await this.publishEmailVerificationRequested(user, verificationCode);
      } catch (error) {
        logger.error("Failed to send registration verification email", {
          userId: user._id.toString(),
          email: user.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return user;
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerifiedAt) {
      return user;
    }

    if (!user.emailVerificationCodeHash || !user.emailVerificationCodeExpiresAt) {
      throw new Error("Verification code not available");
    }

    if (user.emailVerificationCodeExpiresAt.getTime() < Date.now()) {
      throw new Error("Verification code expired");
    }

    const codeHash = this.hashEmailVerificationCode(code);
    if (codeHash !== user.emailVerificationCodeHash) {
      throw new Error("Invalid verification code");
    }

    const verifiedUser = await this.updateById(user._id.toString(), {
      $set: {
        emailVerifiedAt: new Date(),
      },
      $unset: {
        emailVerificationCodeHash: "",
        emailVerificationCodeExpiresAt: "",
      },
    });

    if (!verifiedUser) {
      throw new Error("User not found");
    }

    return verifiedUser;
  }

  async resendEmailVerification(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerifiedAt) {
      throw new Error("Email already verified");
    }

    if (
      user.emailVerificationLastSentAt &&
      Date.now() - user.emailVerificationLastSentAt.getTime() < EMAIL_VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      throw new Error("Verification code recently sent");
    }

    const verificationCode = this.generateEmailVerificationCode();
    const updatedUser = await this.updateById(user._id.toString(), {
      $set: {
        emailVerificationCodeHash: this.hashEmailVerificationCode(verificationCode),
        emailVerificationCodeExpiresAt: this.getEmailVerificationExpiresAt(),
        emailVerificationLastSentAt: new Date(),
      },
    });

    if (!updatedUser) {
      throw new Error("User not found");
    }

    await this.publishEmailVerificationRequested(updatedUser, verificationCode);

    return updatedUser;
  }

  async validateUser(email: string, password: string) {
    const user = await this.model.findOne({ email });
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    return user;
  }
}

export const userService = new UserService();
