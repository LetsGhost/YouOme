import { BaseService } from "../../common/base/base.service";
import { NotificationModel } from "../model/notification.model";
import { NotificationEntity } from "../entity/notification.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { NotificationCreatedEvent } from "../events/notification-created.event";
import { userService } from "../../user/service/user.service";

const SYSTEM_ANNOUNCEMENT_TYPE = "system.announcement";

export class NotificationService extends BaseService<NotificationEntity> {
  constructor() {
    super(NotificationModel);
  }

  async createNotification(userId: string, type: string, payload?: Record<string, unknown>) {
    const note = await this.create({ userId, type, payload });
    const event = new NotificationCreatedEvent(note._id.toString(), { userId: note.userId, type: note.type });
    await eventBus.publish(event);
    return note;
  }

  async listForUser(userId: string) {
    return this.model.find({ userId }).sort({ createdAt: -1 });
  }

  async markRead(notificationId: string, userId: string) {
    const note = await this.model.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { readAt: new Date() } },
      { new: true }
    );

    if (!note) {
      throw new Error("Notification not found");
    }

    return note;
  }

  async markAllRead(userId: string) {
    await this.model.updateMany(
      { userId, $or: [{ readAt: { $exists: false } }, { readAt: null }] },
      { $set: { readAt: new Date() } }
    );

    return this.listForUser(userId);
  }

  async deleteNotification(notificationId: string, userId: string) {
    const note = await this.model.findOneAndDelete({ _id: notificationId, userId });

    if (!note) {
      throw new Error("Notification not found");
    }

    return note;
  }

  async clearForUser(userId: string) {
    return this.model.deleteMany({ userId });
  }

  /**
   * Sysadmin broadcast: fans a single announcement out as an individual
   * notification document per current user, reusing the existing per-user
   * notification path rather than introducing a separate broadcast model.
   */
  async broadcastToAllUsers(title: string, message: string) {
    const users = await userService.findAll({});

    return Promise.all(
      users.map((user) =>
        this.createNotification(user._id.toString(), SYSTEM_ANNOUNCEMENT_TYPE, { title, message })
      )
    );
  }
}

export const notificationService = new NotificationService();
