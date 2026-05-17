import { EventHandler } from "../../common/messaging/event-handler";
import { GroupCreatedEvent } from "../../group/events/group-created.event";
import { groupPolicyService } from "../service/groupPolicy.service";
import { logger } from "../../common/logger/logger";

export class GroupCreatedGroupPolicyHandler extends EventHandler<GroupCreatedEvent> {
  getEventType(): string {
    return "group.created";
  }

  async handle(event: GroupCreatedEvent): Promise<void> {
    logger.info("Group created event received by group-policy module", {
      groupId: event.aggregateId,
      createdByUserId: event.payload.createdByUserId,
    });

    await groupPolicyService.createPolicy(event.aggregateId, {
      groupId: event.aggregateId,
    } as never);
  }
}

export const groupCreatedGroupPolicyHandler = new GroupCreatedGroupPolicyHandler();