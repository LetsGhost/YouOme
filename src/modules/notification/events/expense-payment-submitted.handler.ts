import { EventHandler } from "../../common/messaging/event-handler";
import { PaymentSubmittedEvent } from "../../expense-participant/events/payment-submitted.event";
import { notificationService } from "../service/notification.service";
import { expenseService } from "../../expense/service/expense.service";
import { groupService } from "../../group/service/group.service";
import { userService } from "../../user/service/user.service";
import { logger } from "../../common/logger/logger";

export class ExpensePaymentSubmittedNotificationHandler extends EventHandler<PaymentSubmittedEvent> {
  getEventType(): string {
    return "expense-participant.payment_submitted";
  }

  async handle(event: PaymentSubmittedEvent): Promise<void> {
    logger.info("Expense payment submitted event received by notification module", {
      expenseId: event.aggregateId,
      userId: event.payload.userId,
    });

    const expense = await expenseService.findById(event.payload.expenseId);

    if (!expense || !expense.createdByUserId) {
      return;
    }

    const [group, submitter] = await Promise.all([
      groupService.findById(expense.groupId),
      userService.findById(event.payload.userId),
    ]);

    await notificationService.createNotification(expense.createdByUserId, "expense.payment_submitted", {
      expenseId: event.payload.expenseId,
      groupId: expense.groupId,
      groupName: group?.name ?? "a group",
      title: expense.title,
      userId: event.payload.userId,
      userName: submitter?.name ?? submitter?.email ?? "someone",
      comment: event.payload.comment ?? "",
      submissionCount: event.payload.submissionCount,
    });
  }
}

export const expensePaymentSubmittedNotificationHandler = new ExpensePaymentSubmittedNotificationHandler();