import { BaseService } from "../../common/base/base.service";
import { ExpenseParticipantModel } from "../model/expenseParticipant.model";
import { ExpenseParticipantEntity } from "../entity/expenseParticipant.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { PaymentSubmittedEvent } from "../events/payment-submitted.event";
import { PaymentRejectedEvent } from "../events/payment-rejected.event";
import { PaymentConfirmedEvent } from "../events/payment-confirmed.event";

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

    if (!updated) {
      throw new Error("Participant not found");
    }

    const event = new PaymentSubmittedEvent(expenseId, {
      expenseId,
      userId,
      comment,
      submissionCount: updated.submissionCount || submissionCount,
    });
    await eventBus.publish(event);

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

    if (!updated) {
      throw new Error("Participant not found");
    }

    const event = new PaymentRejectedEvent(expenseId, {
      expenseId,
      userId,
      submissionCount: updated.submissionCount || 0,
    });
    await eventBus.publish(event);

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

    if (!updated) {
      throw new Error("Participant not found");
    }

    const event = new PaymentConfirmedEvent(expenseId, {
      expenseId,
      userId,
      shareAmount: updated.shareAmount,
    });
    await eventBus.publish(event);

    return updated;
  }

  async getByExpense(expenseId: string) {
    return this.model.find({ expenseId });
  }

  async hasSubmittedPayment(expenseId: string) {
    const count = await this.model.countDocuments({ expenseId, status: { $ne: "pending" } });
    return count > 0;
  }

  async rescaleShares(expenseId: string, ratio: number) {
    const participants = await this.getByExpense(expenseId);

    await Promise.all(
      participants.map((participant) =>
        this.model.updateOne(
          { _id: participant._id },
          { $set: { shareAmount: Math.round(participant.shareAmount * ratio * 100) / 100 } }
        )
      )
    );
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

  async sumOutstandingShares(expenseIds: string[], userId: string) {
    const participants = await this.model.find({
      expenseId: { $in: expenseIds },
      userId,
      status: { $ne: "payment-confirmed" },
    });

    return participants.reduce((sum, participant) => sum + participant.shareAmount, 0);
  }

  async getStaleSubmitted(olderThan: Date) {
    return this.model.find({ status: "payment-submitted", submittedAt: { $lte: olderThan } });
  }
}

export const expenseParticipantService = new ExpenseParticipantService();
