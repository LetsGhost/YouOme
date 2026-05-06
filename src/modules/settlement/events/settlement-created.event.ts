import { BaseDomainEvent } from "../../common/messaging/event";

type SettlementCreatedPayload = {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export class SettlementCreatedEvent extends BaseDomainEvent<SettlementCreatedPayload> {
  constructor(aggregateId: string, payload: SettlementCreatedPayload) {
    super("settlement.created", aggregateId, payload);
  }
}
