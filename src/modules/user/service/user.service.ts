import bcrypt from "bcrypt";
import { HydratedDocument } from "mongoose";

import { BaseService } from "../../common/base/base.service";
import { UserModel } from "../model/user.model";
import { UserEntity } from "../entity/user.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { UserCreatedEvent } from "../events/user-created.event";
import { UserEmailVerificationRequestedEvent } from "../events/user-email-verification-requested.event";
import { verificationTokenService } from "../../auth/service/verification-token.service";
import { logger } from "../../common/logger/logger";
import { storageService } from "../../common/storage/storage.service";
import { processAvatarImage } from "../../common/storage/image.util";

export class UserService extends BaseService<UserEntity> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email });
  }

  async createUser(email: string, password: string, name?: string) {
    const displayName = name && name.trim().length > 0 ? name.trim() : email.split("@")[0];
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await this.model.findOne({ email });
    if (existing) {
      if (existing.emailVerifiedAt) {
        throw new Error("Email already exists");
      }

      // Unverified account re-registering (mistyped email, never received the original
      // link, etc.) - rotate credentials and resend rather than permanently locking them
      // out with an "already exists" error they can't act on.
      existing.password = passwordHash;
      existing.name = displayName;
      await existing.save();
      await this.issueEmailVerification(existing);

      return existing;
    }

    const user = await this.create({
      email,
      password: passwordHash,
      name: displayName,
    });

    // Emit domain event
    const event = new UserCreatedEvent(user._id.toString(), {
      email: user.email,
      role: user.role,
    });
    await eventBus.publish(event);

    await this.issueEmailVerification(user);

    return user;
  }

  /**
   * Issues a fresh verification token and publishes the request-email event. Caught and
   * logged rather than thrown - a flaky email-service must never fail registration itself,
   * the user can always hit resend-verification to retry.
   */
  private async issueEmailVerification(user: HydratedDocument<UserEntity>) {
    try {
      const token = await verificationTokenService.issueEmailVerificationToken(user._id.toString());
      await eventBus.publish(
        new UserEmailVerificationRequestedEvent(user._id.toString(), {
          email: user.email,
          name: user.name,
          token,
        })
      );
    } catch (error) {
      logger.error("Failed to send verification email", {
        userId: user._id.toString(),
        email: user.email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async issueEmailVerificationResend(user: HydratedDocument<UserEntity>) {
    return this.issueEmailVerification(user);
  }

  async markEmailVerified(userId: string) {
    return this.updateById(userId, { $set: { emailVerifiedAt: new Date() } });
  }

  async setAvatar(userId: string, fileBuffer: Buffer) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const { buffer, contentType, extension } = await processAvatarImage(fileBuffer);
    const key = `users/${userId}.${extension}`;

    await storageService.uploadObject(key, buffer, contentType);
    return this.updateById(userId, { avatarKey: key });
  }

  async removeAvatar(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.avatarKey) {
      await storageService.deleteObject(user.avatarKey);
    }

    return this.updateById(userId, { $unset: { avatarKey: "" } });
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

  async updateProfile(userId: string, updates: { name?: string; email?: string; bio?: string }) {
    if (updates.email && (await this.model.exists({ email: updates.email, _id: { $ne: userId } }))) {
      throw new Error("Email already exists");
    }

    const user = await this.updateById(userId, updates);
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.model.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return user;
  }

  /**
   * Used by the forgot-password flow, where the caller has already been authorized by
   * possession of a valid reset token rather than the current password.
   */
  async resetPassword(userId: string, newPassword: string) {
    const user = await this.model.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return user;
  }
}

export const userService = new UserService();
