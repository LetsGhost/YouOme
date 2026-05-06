import { BaseDomainEvent } from "../../common/messaging/event";

type GroupMemberCreatedPayload = {
  groupId: string;
  userId: string;
  role: string;
};

export class GroupMemberCreatedEvent extends BaseDomainEvent<GroupMemberCreatedPayload> {
  constructor(aggregateId: string, payload: GroupMemberCreatedPayload) {
    super("groupMember.created", aggregateId, payload);
  }
}
