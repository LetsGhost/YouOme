import { BaseDomainEvent } from "../../common/messaging/event";

type GroupInviteCreatedPayload = {
  groupId: string;
  invitedUserId?: string;
  invitedByUserId?: string;
};

export class GroupInviteCreatedEvent extends BaseDomainEvent<GroupInviteCreatedPayload> {
  constructor(aggregateId: string, payload: GroupInviteCreatedPayload) {
    super("groupInvite.created", aggregateId, payload);
  }
}
