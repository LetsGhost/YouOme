import { BaseService } from "../../common/base/base.service";
import { ExpenseParticipantModel } from "../model/expenseParticipant.model";
import { ExpenseParticipantEntity } from "../entity/expenseParticipant.entity";

export class ExpenseParticipantService extends BaseService<ExpenseParticipantEntity> {
  constructor() {
    super(ExpenseParticipantModel);
  }

  async addParticipants(expenseId: string, participants: Array<{ userId: string; shareAmount?: number }>) {
    const docs = [] as any[];
    for (const p of participants) {
      const doc = await this.create({ expenseId, userId: p.userId, shareAmount: p.shareAmount || 0 });
      docs.push(doc);
    }
    return docs;
  }

  async confirmParticipant(expenseId: string, userId: string) {
    const participant = await this.model.findOneAndUpdate(
      { expenseId, userId },
      { $set: { paidAt: new Date(), status: "confirmed" } },
      { new: true }
    );
    return participant;
  }

  async getByExpense(expenseId: string) {
    return this.model.find({ expenseId });
  }

  async allConfirmed(expenseId: string) {
    const pending = await this.model.countDocuments({ expenseId, status: { $ne: "confirmed" } });
    return pending === 0;
  }
}

export const expenseParticipantService = new ExpenseParticipantService();
