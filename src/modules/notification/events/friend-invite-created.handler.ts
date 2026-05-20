import { EventHandler } from "../../common/messaging/event-handler";
import { FriendInviteCreatedEvent } from "../../friend-invite/events/friendInvite-created.event";
import { notificationService } from "../service/notification.service";
import { logger } from "../../common/logger/logger";

export class FriendInviteCreatedNotificationHandler extends EventHandler<FriendInviteCreatedEvent> {
  getEventType(): string {
    return "friend.invite.created";
  }

  async handle(event: FriendInviteCreatedEvent): Promise<void> {
    logger.info("Friend invite created event received by notification module", {
      inviteId: event.aggregateId,
      fromUserId: event.payload.fromUserId,
      toUserId: event.payload.toUserId,
    });

    await notificationService.createNotification(event.payload.toUserId, "friend.request", {
      inviteId: event.aggregateId,
      fromUserId: event.payload.fromUserId,
      fromUserEmail: event.payload.fromUserEmail,
      fromUserName: event.payload.fromUserName,
    });
  }
}

export const friendInviteCreatedNotificationHandler = new FriendInviteCreatedNotificationHandler();