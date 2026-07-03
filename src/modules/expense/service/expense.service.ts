import { BaseService } from "../../common/base/base.service";
import { ExpenseModel } from "../model/expense.model";
import { ExpenseEntity } from "../entity/expense.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { ExpenseCreatedEvent } from "../events/expense-created.event";
import { ExpenseCreatedWithParticipantsEvent } from "../events/expense-created-with-participants.event";
import { expenseParticipantService } from "../../expense-participant/service/expenseParticipant.service";
import { UpdateExpenseDTO } from "../schema/expense.schema";

export class ExpenseService extends BaseService<ExpenseEntity> {
  constructor() {
    super(ExpenseModel);
  }

  async createExpense(
    groupId: string,
    createdByUserId: string,
    totalAmount: number,
    title: string,
    options: {
      paidByUserId?: string;
      splitType?: string;
      note?: string;
      participants?: Array<{ userId: string; shareAmount?: number }>;
    } = {}
  ) {
    const expense = await this.create({
      groupId,
      createdByUserId,
      totalAmount,
      title,
      paidByUserId: options.paidByUserId,
      splitType: options.splitType,
      note: options.note,
      status: "pending_confirmations",
    });

    const event = new ExpenseCreatedEvent(expense._id.toString(), {
      groupId: expense.groupId,
      title: expense.title,
      totalAmount: expense.totalAmount,
    });
    await eventBus.publish(event);

    if (options.participants && options.participants.length > 0) {
      const participantEvent = new ExpenseCreatedWithParticipantsEvent(expense._id.toString(), {
        groupId: expense.groupId,
        title: expense.title,
        totalAmount: expense.totalAmount,
        participants: options.participants,
      });
      await eventBus.publish(participantEvent);
    }

    return expense;
  }

  async updateExpense(expenseId: string, userId: string, updates: UpdateExpenseDTO) {
    const expense = await this.findById(expenseId);

    if (!expense) {
      throw new Error("Expense not found");
    }

    if (expense.createdByUserId !== userId) {
      throw new Error("Only the expense creator can edit this expense");
    }

    const hasSubmittedPayment = await expenseParticipantService.hasSubmittedPayment(expenseId);
    if (hasSubmittedPayment) {
      throw new Error("This expense can no longer be edited because a payment has already been submitted");
    }

    const previousTotalAmount = expense.totalAmount;
    const updated = await this.updateById(expenseId, updates);

    if (!updated) {
      throw new Error("Expense not found");
    }

    if (
      typeof updates.totalAmount === "number" &&
      updates.totalAmount !== previousTotalAmount &&
      previousTotalAmount > 0
    ) {
      await expenseParticipantService.rescaleShares(expenseId, updates.totalAmount / previousTotalAmount);
    }

    return updated;
  }

  async deleteExpense(expenseId: string, userId: string) {
    const expense = await this.findById(expenseId);

    if (!expense) {
      throw new Error("Expense not found");
    }

    if (expense.createdByUserId !== userId) {
      throw new Error("Only the expense creator can delete this expense");
    }

    const hasSubmittedPayment = await expenseParticipantService.hasSubmittedPayment(expenseId);
    if (hasSubmittedPayment) {
      throw new Error("This expense can no longer be deleted because a payment has already been submitted");
    }

    await expenseParticipantService.deleteMany({ expenseId });
    await this.deleteById(expenseId);

    return { message: "Expense deleted successfully" };
  }
}

export const expenseService = new ExpenseService();
