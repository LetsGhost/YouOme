import { BaseDomainEvent } from "../../common/messaging/event";

type P2PThreadCreatedPayload = {
  userAId: string;
  userBId: string;
};

export class P2PThreadCreatedEvent extends BaseDomainEvent<P2PThreadCreatedPayload> {
  constructor(aggregateId: string, payload: P2PThreadCreatedPayload) {
    super("p2pThread.created", aggregateId, payload);
  }
}
