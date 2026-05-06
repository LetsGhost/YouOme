import { BaseDomainEvent } from "../../common/messaging/event";

type ExpenseCreatedPayload = {
  groupId: string;
  title: string;
  totalAmount: number;
};

export class ExpenseCreatedEvent extends BaseDomainEvent<ExpenseCreatedPayload> {
  constructor(aggregateId: string, payload: ExpenseCreatedPayload) {
    super("expense.created", aggregateId, payload);
  }
}
