import { BaseDomainEvent } from "../../common/messaging/event";

type PaymentConfirmedPayload = {
  expenseId: string;
  userId: string;
  shareAmount: number;
};

export class PaymentConfirmedEvent extends BaseDomainEvent<PaymentConfirmedPayload> {
  constructor(aggregateId: string, payload: PaymentConfirmedPayload) {
    super("expense-participant.payment_confirmed", aggregateId, payload);
  }
}
