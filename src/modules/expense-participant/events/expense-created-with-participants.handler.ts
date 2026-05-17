import { EventHandler } from "../../common/messaging/event-handler";
import { ExpenseCreatedWithParticipantsEvent } from "../../expense/events/expense-created-with-participants.event";
import { expenseParticipantService } from "../service/expenseParticipant.service";
import { logger } from "../../common/logger/logger";

export class ExpenseCreatedWithParticipantsHandler extends EventHandler<ExpenseCreatedWithParticipantsEvent> {
  getEventType(): string {
    return "expense.created_with_participants";
  }

  async handle(event: ExpenseCreatedWithParticipantsEvent): Promise<void> {
    logger.info("Expense created with participants event received", {
      expenseId: event.aggregateId,
      participantCount: event.payload.participants.length,
    });

    try {
      if (event.payload.participants && event.payload.participants.length > 0) {
        await expenseParticipantService.addParticipants(
          event.aggregateId,
          event.payload.participants
        );

        logger.info("Participants created from event", {
          expenseId: event.aggregateId,
          count: event.payload.participants.length,
        });
      }
    } catch (error) {
      logger.error("Failed to create participants from event", {
        expenseId: event.aggregateId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}

export const expenseCreatedWithParticipantsHandler = new ExpenseCreatedWithParticipantsHandler();
