import { EventHandler } from "../../common/messaging/event-handler";
import { PaymentRejectedEvent } from "../../expense-participant/events/payment-rejected.event";
import { notificationService } from "../service/notification.service";
import { expenseService } from "../../expense/service/expense.service";
import { groupService } from "../../group/service/group.service";
import { logger } from "../../common/logger/logger";

export class ExpensePaymentRejectedNotificationHandler extends EventHandler<PaymentRejectedEvent> {
  getEventType(): string {
    return "expense-participant.payment_rejected";
  }

  async handle(event: PaymentRejectedEvent): Promise<void> {
    logger.info("Expense payment rejected event received by notification module", {
      expenseId: event.aggregateId,
      userId: event.payload.userId,
    });

    const expense = await expenseService.findById(event.payload.expenseId);

    if (!expense) {
      return;
    }

    const group = await groupService.findById(expense.groupId);

    await notificationService.createNotification(event.payload.userId, "expense.payment_rejected", {
      expenseId: event.payload.expenseId,
      groupId: expense.groupId,
      groupName: group?.name ?? "a group",
      title: expense.title,
      submissionCount: event.payload.submissionCount,
    });
  }
}

export const expensePaymentRejectedNotificationHandler = new ExpensePaymentRejectedNotificationHandler();