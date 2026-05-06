import { BaseDomainEvent } from "../../common/messaging/event";

type GroupCreatedPayload = {
  name: string;
  createdByUserId: string;
};

export class GroupCreatedEvent extends BaseDomainEvent<GroupCreatedPayload> {
  constructor(aggregateId: string, payload: GroupCreatedPayload) {
    super("group.created", aggregateId, payload);
  }
}
