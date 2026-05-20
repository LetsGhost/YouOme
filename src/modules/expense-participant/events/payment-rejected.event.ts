import { BaseDomainEvent } from "../../common/messaging/event";

type PaymentRejectedPayload = {
  expenseId: string;
  userId: string;
  submissionCount: number;
};

export class PaymentRejectedEvent extends BaseDomainEvent<PaymentRejectedPayload> {
  constructor(aggregateId: string, payload: PaymentRejectedPayload) {
    super("expense-participant.payment_rejected", aggregateId, payload);
  }
}
