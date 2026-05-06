import { BaseDomainEvent } from "../../common/messaging/event";

type P2PExpenseCreatedPayload = {
  threadId: string;
  title: string;
  totalAmount: number;
};

export class P2PExpenseCreatedEvent extends BaseDomainEvent<P2PExpenseCreatedPayload> {
  constructor(aggregateId: string, payload: P2PExpenseCreatedPayload) {
    super("p2pExpense.created", aggregateId, payload);
  }
}
