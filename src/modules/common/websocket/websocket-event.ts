import { BaseDomainEvent } from "../messaging/event";

export class WsEvent extends BaseDomainEvent {
  constructor(type: string, aggregateId: string, payload: Record<string, unknown>) {
    super(type, aggregateId, payload);
  }
}
