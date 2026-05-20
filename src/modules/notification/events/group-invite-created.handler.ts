import { EventHandler } from "../../common/messaging/event-handler";
import { GroupInviteCreatedEvent } from "../../group-invite/events/groupInvite-created.event";
import { notificationService } from "../service/notification.service";
import { logger } from "../../common/logger/logger";
import { groupService } from "../../group/service/group.service";
import { userService } from "../../user/service/user.service";

export class GroupInviteCreatedNotificationHandler extends EventHandler<GroupInviteCreatedEvent> {
  getEventType(): string {
    return "groupInvite.created";
  }

  async handle(event: GroupInviteCreatedEvent): Promise<void> {
    logger.info("Group invite created event received by notification module", {
      inviteId: event.aggregateId,
      groupId: event.payload.groupId,
      invitedUserId: event.payload.invitedUserId,
    });

    if (!event.payload.invitedUserId) {
      logger.warn("Skipping group invite notification without invited user", {
        inviteId: event.aggregateId,
        groupId: event.payload.groupId,
      });
      return;
    }

    const [group, invitedByUser] = await Promise.all([
      groupService.findById(event.payload.groupId),
      event.payload.invitedByUserId ? userService.findById(event.payload.invitedByUserId) : Promise.resolve(null),
    ]);

    await notificationService.createNotification(event.payload.invitedUserId, "group.invite", {
      inviteId: event.aggregateId,
      groupId: event.payload.groupId,
      groupName: group?.name ?? "a group",
      invitedByUserId: event.payload.invitedByUserId ?? "",
      invitedByUserName: invitedByUser?.name ?? invitedByUser?.email ?? "Someone",
    });
  }
}

export const groupInviteCreatedNotificationHandler = new GroupInviteCreatedNotificationHandler();