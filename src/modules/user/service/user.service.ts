import bcrypt from "bcrypt";

import { BaseService } from "../../common/base/base.service";
import { UserModel } from "../model/user.model";
import { UserEntity } from "../entity/user.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { UserCreatedEvent } from "../events/user-created.event";
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
    if (await this.model.exists({ email })) {
      throw new Error("Email already exists");
    }

    const displayName = name && name.trim().length > 0 ? name.trim() : email.split("@")[0];

    const user = await this.create({
      email,
      password: await bcrypt.hash(password, 10),
      name: displayName,
    });

    // Emit domain event
    const event = new UserCreatedEvent(user._id.toString(), {
      email: user.email,
      role: user.role,
    });
    await eventBus.publish(event);

    return user;
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
}

export const userService = new UserService();
