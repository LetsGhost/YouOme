import { EventHandler } from "../../common/messaging/event-handler";
import { PaymentConfirmedEvent } from "../../expense-participant/events/payment-confirmed.event";
import { notificationService } from "../service/notification.service";
import { expenseService } from "../../expense/service/expense.service";
import { groupService } from "../../group/service/group.service";
import { logger } from "../../common/logger/logger";

export class ExpensePaymentConfirmedNotificationHandler extends EventHandler<PaymentConfirmedEvent> {
  getEventType(): string {
    return "expense-participant.payment_confirmed";
  }

  async handle(event: PaymentConfirmedEvent): Promise<void> {
    logger.info("Expense payment confirmed event received by notification module", {
      expenseId: event.aggregateId,
      userId: event.payload.userId,
    });

    const expense = await expenseService.findById(event.payload.expenseId);

    if (!expense) {
      return;
    }

    const group = await groupService.findById(expense.groupId);

    await notificationService.createNotification(event.payload.userId, "expense.payment_confirmed", {
      expenseId: event.payload.expenseId,
      groupId: expense.groupId,
      groupName: group?.name ?? "a group",
      title: expense.title,
      shareAmount: event.payload.shareAmount,
    });
  }
}

export const expensePaymentConfirmedNotificationHandler = new ExpensePaymentConfirmedNotificationHandler();