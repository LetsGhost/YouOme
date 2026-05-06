import { BaseDomainEvent } from "../../common/messaging/event";

type DebtLedgerEntryCreatedPayload = {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export class DebtLedgerEntryCreatedEvent extends BaseDomainEvent<DebtLedgerEntryCreatedPayload> {
  constructor(aggregateId: string, payload: DebtLedgerEntryCreatedPayload) {
    super("debtLedgerEntry.created", aggregateId, payload);
  }
}
