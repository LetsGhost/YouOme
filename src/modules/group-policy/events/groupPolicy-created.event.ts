import { BaseDomainEvent } from "../../common/messaging/event";

type GroupPolicyCreatedPayload = {
  groupId: string;
};

export class GroupPolicyCreatedEvent extends BaseDomainEvent<GroupPolicyCreatedPayload> {
  constructor(aggregateId: string, payload: GroupPolicyCreatedPayload) {
    super("groupPolicy.created", aggregateId, payload);
  }
}
