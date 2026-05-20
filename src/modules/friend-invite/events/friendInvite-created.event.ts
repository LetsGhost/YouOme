import { BaseDomainEvent } from "../../common/messaging/event";

type FriendInviteCreatedPayload = {
  fromUserId: string;
  toUserId: string;
  fromUserEmail: string;
  fromUserName: string;
};

export class FriendInviteCreatedEvent extends BaseDomainEvent<FriendInviteCreatedPayload> {
  constructor(aggregateId: string, payload: FriendInviteCreatedPayload) {
    super("friend.invite.created", aggregateId, payload);
  }
}