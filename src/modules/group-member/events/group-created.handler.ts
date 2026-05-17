import { EventHandler } from "../../common/messaging/event-handler";
import { GroupCreatedEvent } from "../../group/events/group-created.event";
import { groupMemberService } from "../service/groupMember.service";
import { logger } from "../../common/logger/logger";

export class GroupCreatedGroupMemberHandler extends EventHandler<GroupCreatedEvent> {
  getEventType(): string {
    return "group.created";
  }

  async handle(event: GroupCreatedEvent): Promise<void> {
    logger.info("Group created event received by group-member module", {
      groupId: event.aggregateId,
      createdByUserId: event.payload.createdByUserId,
    });

    await groupMemberService.addMember(
      event.aggregateId,
      event.payload.createdByUserId,
      "owner",
      event.payload.createdByUserId
    );
  }
}

export const groupCreatedGroupMemberHandler = new GroupCreatedGroupMemberHandler();