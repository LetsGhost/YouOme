import { BaseDomainEvent } from "../../common/messaging/event";

type SettlementRunCreatedPayload = {
  groupId: string;
  settlements: Array<{ fromUserId: string; toUserId: string; amount: number }>;
};

export class SettlementRunCreatedEvent extends BaseDomainEvent<SettlementRunCreatedPayload> {
  constructor(aggregateId: string, payload: SettlementRunCreatedPayload) {
    super("settlementRun.created", aggregateId, payload);
  }
}
