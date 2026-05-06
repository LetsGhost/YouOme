import { BaseDomainEvent } from "../../common/messaging/event";

type CollaborationCreatedPayload = {
  ownerUserId: string;
  collaboratorUserId: string;
};

export class CollaborationCreatedEvent extends BaseDomainEvent<CollaborationCreatedPayload> {
  constructor(aggregateId: string, payload: CollaborationCreatedPayload) {
    super("collaboration.created", aggregateId, payload);
  }
}
