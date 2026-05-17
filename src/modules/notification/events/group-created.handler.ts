import { EventHandler } from "../../common/messaging/event-handler";
import { GroupCreatedEvent } from "../../group/events/group-created.event";
import { notificationService } from "../service/notification.service";
import { logger } from "../../common/logger/logger";

export class GroupCreatedNotificationHandler extends EventHandler<GroupCreatedEvent> {
  getEventType(): string {
    return "group.created";
  }

  async handle(event: GroupCreatedEvent): Promise<void> {
    logger.info("Group created event received by notification module", {
      groupId: event.aggregateId,
      createdByUserId: event.payload.createdByUserId,
    });

    await notificationService.createNotification(event.payload.createdByUserId, "group.created", {
      groupId: event.aggregateId,
      name: event.payload.name,
    });
  }
}

export const groupCreatedNotificationHandler = new GroupCreatedNotificationHandler();