import { EventHandler } from "../../common/messaging/event-handler";
import { GroupInviteAcceptedEvent } from "../../group-invite/events/groupInvite-accepted.event";
import { groupMemberService } from "../service/groupMember.service";
import { logger } from "../../common/logger/logger";

export class GroupInviteAcceptedHandler extends EventHandler<GroupInviteAcceptedEvent> {
  getEventType(): string {
    return "groupInvite.accepted";
  }

  async handle(event: GroupInviteAcceptedEvent): Promise<void> {
    logger.info("Group invite accepted event received by group-member module", {
      inviteId: event.aggregateId,
      groupId: event.payload.groupId,
      invitedUserId: event.payload.invitedUserId,
    });

    await groupMemberService.addMember(
      event.payload.groupId,
      event.payload.invitedUserId,
      "member",
      event.payload.invitedByUserId
    );
  }
}

export const groupInviteAcceptedHandler = new GroupInviteAcceptedHandler();