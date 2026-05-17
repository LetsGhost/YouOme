import { BaseService } from "../../common/base/base.service";
import { ExpenseModel } from "../model/expense.model";
import { ExpenseEntity } from "../entity/expense.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { ExpenseCreatedEvent } from "../events/expense-created.event";

export class ExpenseService extends BaseService<ExpenseEntity> {
  constructor() {
    super(ExpenseModel);
  }

  async createExpense(
    groupId: string,
    createdByUserId: string,
    totalAmount: number,
    title: string,
    options: { paidByUserId?: string; splitType?: string; note?: string } = {}
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

    return expense;
  }
}

export const expenseService = new ExpenseService();
