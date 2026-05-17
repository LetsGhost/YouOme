import { BaseDomainEvent } from "../../common/messaging";

type FriendAddedPayload = {
  userId: string;
  friendUserId: string;
};

export class FriendAddedEvent extends BaseDomainEvent<FriendAddedPayload> {
  constructor(
    aggregateId: string,
    payload: FriendAddedPayload
  ) {
    super("friend.added", aggregateId, payload);
  } 
}