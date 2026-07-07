import { EventHandler } from "../../common/messaging/event-handler";
import { GroupInviteCreatedEvent } from "../../group-invite/events/groupInvite-created.event";
import { userService } from "../../user/service/user.service";
import { groupService } from "../../group/service/group.service";
import { mailService } from "../service/mail.service";
import { env } from "../../../config/env";

/**
 * Example wiring for the generic notification-email path (mailService.sendNotificationEmail),
 * mirroring notification/events/group-invite-created.handler.ts's in-app notification. Every
 * other notification-worthy event (friend.invite.created, expense.created_with_participants,
 * etc.) can follow this exact same one-file pattern - not built out yet, this is the reference.
 */
export class GroupInviteCreatedMailHandler extends EventHandler<GroupInviteCreatedEvent> {
  getEventType(): string {
    return "groupInvite.created";
  }

  async handle(event: GroupInviteCreatedEvent): Promise<void> {
    if (!event.payload.invitedUserId) {
      return;
    }

    const [invitedUser, group] = await Promise.all([
      userService.findById(event.payload.invitedUserId),
      groupService.findById(event.payload.groupId),
    ]);

    if (!invitedUser) {
      return;
    }

    await mailService.sendNotificationEmail(
      {
        email: invitedUser.email,
        name: invitedUser.name,
        emailNotificationsEnabled: invitedUser.emailNotificationsEnabled,
      },
      {
        heading: "You've been invited to a group",
        message: `You've been invited to join "${group?.name ?? "a group"}" on YouOme.`,
        actionUrl: `${env.APP_URL}/groups`,
        actionLabel: "View invite",
      }
    );
  }
}

export const groupInviteCreatedMailHandler = new GroupInviteCreatedMailHandler();
