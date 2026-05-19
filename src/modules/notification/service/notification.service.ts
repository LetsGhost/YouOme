import { BaseService } from "../../common/base/base.service";
import { NotificationModel } from "../model/notification.model";
import { NotificationEntity } from "../entity/notification.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { NotificationCreatedEvent } from "../events/notification-created.event";

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
}

export const notificationService = new NotificationService();
