import { BaseDomainEvent } from "../../common/messaging/event";

type PaymentSubmittedPayload = {
  expenseId: string;
  userId: string;
  comment?: string;
  submissionCount: number;
};

export class PaymentSubmittedEvent extends BaseDomainEvent<PaymentSubmittedPayload> {
  constructor(aggregateId: string, payload: PaymentSubmittedPayload) {
    super("expense-participant.payment_submitted", aggregateId, payload);
  }
}
