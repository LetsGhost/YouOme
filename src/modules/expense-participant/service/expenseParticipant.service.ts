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

  async submitPayment(expenseId: string, userId: string, comment?: string) {
    const participant = await this.model.findOne({ expenseId, userId });
    if (!participant) {
      throw new Error("Participant not found");
    }

    const submissionCount = (participant.submissionCount || 0) + 1;
    const updated = await this.model.findOneAndUpdate(
      { expenseId, userId },
      {
        $set: {
          status: "payment-submitted",
          submittedAt: new Date(),
          submissionCount,
          comment,
        },
      },
      { new: true }
    );
    return updated;
  }

  async rejectPayment(expenseId: string, userId: string) {
    const updated = await this.model.findOneAndUpdate(
      { expenseId, userId },
      {
        $set: {
          status: "pending",
          submittedAt: undefined,
          comment: undefined,
        },
      },
      { new: true }
    );
    return updated;
  }

  async confirmPayment(expenseId: string, userId: string) {
    const updated = await this.model.findOneAndUpdate(
      { expenseId, userId },
      {
        $set: {
          status: "payment-confirmed",
          confirmedAt: new Date(),
          paidAt: new Date(),
        },
      },
      { new: true }
    );
    return updated;
  }

  async getByExpense(expenseId: string) {
    return this.model.find({ expenseId });
  }

  async allConfirmed(expenseId: string) {
    const pending = await this.model.countDocuments({
      expenseId,
      status: { $ne: "payment-confirmed" },
    });
    return pending === 0;
  }

  async getSubmissionCount(expenseId: string, userId: string) {
    const participant = await this.model.findOne({ expenseId, userId });
    return participant?.submissionCount || 0;
  }
}

export const expenseParticipantService = new ExpenseParticipantService();
