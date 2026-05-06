import { BaseService } from "../../common/base/base.service";
import { P2PExpenseModel } from "../model/p2pExpense.model";
import { P2PExpenseEntity } from "../entity/p2pExpense.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { P2PExpenseCreatedEvent } from "../events/p2pExpense-created.event";

export class P2PExpenseService extends BaseService<P2PExpenseEntity> {
  constructor() {
    super(P2PExpenseModel);
  }

  async createExpense(threadId: string, createdByUserId: string, totalAmount: number, title: string, options: { paidByUserId?: string; splitType?: string } = {}) {
    const expense = await this.create({ threadId, createdByUserId, totalAmount, title, paidByUserId: options.paidByUserId, splitType: options.splitType });
    const event = new P2PExpenseCreatedEvent(expense._id.toString(), { threadId: expense.threadId, title: expense.title, totalAmount: expense.totalAmount });
    await eventBus.publish(event);
    return expense;
  }
}

export const p2pExpenseService = new P2PExpenseService();
