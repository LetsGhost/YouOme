import { BaseDomainEvent } from "../../common/messaging/event";

type GroupInviteAcceptedPayload = {
  groupId: string;
  invitedUserId: string;
  invitedByUserId?: string;
};

export class GroupInviteAcceptedEvent extends BaseDomainEvent<GroupInviteAcceptedPayload> {
  constructor(aggregateId: string, payload: GroupInviteAcceptedPayload) {
    super("groupInvite.accepted", aggregateId, payload);
  }
}