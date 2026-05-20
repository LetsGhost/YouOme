import { EventHandler } from "../../common/messaging/event-handler";
import { ExpenseCreatedWithParticipantsEvent } from "../../expense/events/expense-created-with-participants.event";
import { notificationService } from "../service/notification.service";
import { expenseService } from "../../expense/service/expense.service";
import { groupService } from "../../group/service/group.service";
import { userService } from "../../user/service/user.service";
import { logger } from "../../common/logger/logger";

export class ExpenseCreatedWithParticipantsNotificationHandler extends EventHandler<ExpenseCreatedWithParticipantsEvent> {
  getEventType(): string {
    return "expense.created_with_participants";
  }

  async handle(event: ExpenseCreatedWithParticipantsEvent): Promise<void> {
    logger.info("Expense created with participants event received by notification module", {
      expenseId: event.aggregateId,
      groupId: event.payload.groupId,
      participantCount: event.payload.participants.length,
    });

    const expense = await expenseService.findById(event.aggregateId);

    if (!expense) {
      logger.warn("Skipping expense notifications because the expense no longer exists", {
        expenseId: event.aggregateId,
      });
      return;
    }

    const [group, paidByUser] = await Promise.all([
      groupService.findById(event.payload.groupId),
      expense.paidByUserId ? userService.findById(expense.paidByUserId) : Promise.resolve(null),
    ]);

    const paidByName = paidByUser?.name ?? paidByUser?.email ?? "Someone";

    await Promise.all(
      event.payload.participants
        .filter((participant) => participant.userId !== expense.paidByUserId)
        .map((participant) =>
          notificationService.createNotification(participant.userId, "expense.payment_due", {
            expenseId: event.aggregateId,
            groupId: event.payload.groupId,
            groupName: group?.name ?? "a group",
            title: event.payload.title,
            totalAmount: event.payload.totalAmount,
            shareAmount: participant.shareAmount ?? 0,
            paidByUserId: expense.paidByUserId ?? "",
            paidByUserName: paidByName,
          })
        )
    );
  }
}

export const expenseCreatedWithParticipantsNotificationHandler = new ExpenseCreatedWithParticipantsNotificationHandler();