import { HydratedDocument } from "mongoose";

import { BaseService } from "../../common/base/base.service";
import { SettlementModel } from "../model/settlement.model";
import { SettlementEntity } from "../entity/settlement.entity";
import { eventBus } from "../../common/messaging/event-bus";
import { SettlementCreatedEvent } from "../events/settlement-created.event";
import { expenseParticipantService } from "../../expense-participant/service/expenseParticipant.service";
import { expenseService } from "../../expense/service/expense.service";
import { settlementRunService } from "./settlementRun.service";

export class SettlementService extends BaseService<SettlementEntity> {
  constructor() {
    super(SettlementModel);
  }

  async createSettlement(
    groupId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    options: { runId?: string; expenseIds?: string[] } = {}
  ) {
    const settlement = await this.create({
      groupId,
      fromUserId,
      toUserId,
      amount,
      status: "pending",
      runId: options.runId,
      expenseIds: options.expenseIds ?? [],
    });

    const event = new SettlementCreatedEvent(settlement._id.toString(), {
      groupId: settlement.groupId,
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: settlement.amount,
    });
    await eventBus.publish(event);

    return settlement;
  }

  async findOpenBySourceExpense(expenseId: string) {
    return this.model.find({ status: "pending", expenseIds: expenseId });
  }

  async getByRun(runId: string) {
    return this.model.find({ runId }).sort({ createdAt: -1 });
  }

  /**
   * Per-run totals for the history list. Completed settlements have their
   * `amount` zeroed out on completion (it tracks remaining balance, not
   * history), so the paid total is read from `settledAmount` instead.
   */
  async getRunSummaries(runIds: string[]) {
    const settlements = await this.model.find({ runId: { $in: runIds } });

    const byRun = new Map<string, SettlementEntity[]>();
    for (const settlement of settlements) {
      const list = byRun.get(settlement.runId!) ?? [];
      list.push(settlement);
      byRun.set(settlement.runId!, list);
    }

    const summaries = new Map<
      string,
      { totalAmount: number; participantCount: number; confirmedCount: number; totalCount: number }
    >();

    for (const [runId, list] of byRun) {
      const participantIds = new Set<string>();
      let totalAmount = 0;
      let confirmedCount = 0;

      for (const settlement of list) {
        participantIds.add(settlement.fromUserId);
        participantIds.add(settlement.toUserId);
        totalAmount += settlement.status === "completed" ? settlement.settledAmount ?? 0 : settlement.amount;
        if (settlement.status === "completed") confirmedCount += 1;
      }

      summaries.set(runId, {
        totalAmount: Math.round(totalAmount * 100) / 100,
        participantCount: participantIds.size,
        confirmedCount,
        totalCount: list.length,
      });
    }

    return summaries;
  }

  async getOpenForGroup(groupId: string) {
    return this.model.find({ groupId, status: "pending" }).sort({ createdAt: -1 });
  }

  /**
   * `incoming` only surfaces settlements the debtor has actually confirmed
   * paying (`senderConfirmedAt` set) - otherwise there's nothing for the
   * creditor to approve yet. Symmetrically, `outgoing` drops off once the
   * debtor has confirmed, since the ball is then in the creditor's court.
   * Those not-yet-actionable settlements aren't dropped though - they land
   * in `waiting` so the user can still see the expenses/status involved,
   * just without a button to press.
   */
  async getForUser(groupId: string, userId: string) {
    const settlements = await this.model
      .find({ groupId, status: "pending", $or: [{ fromUserId: userId }, { toUserId: userId }] })
      .sort({ createdAt: -1 });

    const outgoing = settlements.filter(
      (settlement) => settlement.fromUserId === userId && !settlement.senderConfirmedAt
    );
    const incoming = settlements.filter(
      (settlement) => settlement.toUserId === userId && Boolean(settlement.senderConfirmedAt)
    );
    const waiting = settlements.filter(
      (settlement) =>
        (settlement.fromUserId === userId && Boolean(settlement.senderConfirmedAt)) ||
        (settlement.toUserId === userId && !settlement.senderConfirmedAt)
    );

    return {
      outgoing: await Promise.all(outgoing.map((settlement) => this.withExpenseBreakdown(settlement))),
      incoming: await Promise.all(incoming.map((settlement) => this.withExpenseBreakdown(settlement))),
      waiting: await Promise.all(waiting.map((settlement) => this.withExpenseBreakdown(settlement))),
    };
  }

  private async withExpenseBreakdown(settlement: HydratedDocument<SettlementEntity>) {
    return {
      ...settlement.toObject(),
      expenses: await this.getExpenseBreakdown(settlement),
    };
  }

  /**
   * Per-expense detail for a bundled settlement: which expenses were netted
   * into it and where each one currently stands (the bundled participant's
   * payment status), not just the settlement's own aggregate amount.
   */
  private async getExpenseBreakdown(settlement: HydratedDocument<SettlementEntity>) {
    const breakdown: Array<{
      expenseId: string;
      title: string;
      totalAmount: number;
      expenseStatus: string;
      participantStatus: string;
      shareAmount: number;
    }> = [];

    for (const expenseId of settlement.expenseIds) {
      const expense = await expenseService.findById(expenseId);
      if (!expense) continue;

      const participant = await this.findBundledParticipant(expenseId, settlement.fromUserId, settlement.toUserId);

      breakdown.push({
        expenseId,
        title: expense.title,
        totalAmount: expense.totalAmount,
        expenseStatus: expense.status,
        participantStatus: participant?.status ?? "pending",
        shareAmount: participant?.shareAmount ?? 0,
      });
    }

    return breakdown;
  }

  /**
   * Live-recomputes the remaining balance for an open settlement as the
   * same pairwise-net formula used at generation time, re-evaluated
   * against current participant statuses. This can legitimately increase
   * (not just decrease) if the other side settles their offsetting share
   * individually instead of through this bundle - see settlement feature
   * design notes for why that's correct, not a bug.
   */
  async recomputeAmount(settlementId: string) {
    const settlement = await this.findById(settlementId);
    if (!settlement || settlement.status !== "pending") {
      return settlement;
    }

    const fromOwed = await expenseParticipantService.sumOutstandingShares(
      settlement.expenseIds,
      settlement.fromUserId
    );
    const toOwed = await expenseParticipantService.sumOutstandingShares(
      settlement.expenseIds,
      settlement.toUserId
    );

    const remaining = Math.round((fromOwed - toOwed) * 100) / 100;

    if (remaining <= 0) {
      const updated = await this.updateById(settlementId, {
        amount: 0,
        settledAmount: settlement.amount,
        status: "completed",
        completedAt: new Date(),
      });
      await this.maybeCloseRun(settlement.runId);
      return updated;
    }

    return this.updateById(settlementId, { amount: remaining });
  }

  private async maybeCloseRun(runId?: string) {
    if (!runId) return;

    const siblings = await this.model.find({ runId });
    const allDone = siblings.every((sibling) => sibling.status === "completed");

    if (allDone) {
      await settlementRunService.close(runId, "completed");
    }
  }

  async markPaid(settlementId: string, userId: string) {
    const settlement = await this.findById(settlementId);
    if (!settlement) {
      throw new Error("Settlement not found");
    }
    if (settlement.fromUserId !== userId) {
      throw new Error("Forbidden");
    }

    await this.submitOutstandingParticipants(settlement.expenseIds, settlement.fromUserId, settlement.toUserId);
    await this.updateById(settlementId, { senderConfirmedAt: new Date() });
    return this.recomputeAmount(settlementId);
  }

  async approve(settlementId: string, userId: string) {
    const settlement = await this.findById(settlementId);
    if (!settlement) {
      throw new Error("Settlement not found");
    }
    if (settlement.toUserId !== userId) {
      throw new Error("Forbidden");
    }

    await this.confirmSubmittedParticipants(settlement.expenseIds, settlement.fromUserId, settlement.toUserId);
    return this.recomputeAmount(settlementId);
  }

  /**
   * Auto-confirms a debtor's submitted-but-unreviewed "I paid" claims once
   * they've sat past the group's configured autoApproveAfterDays, so a
   * settlement can't stall forever on a creditor who never clicks approve.
   */
  async autoApproveStaleForSettlement(settlementId: string, cutoff: Date) {
    const settlement = await this.findById(settlementId);
    if (!settlement || settlement.status !== "pending") {
      return;
    }

    for (const expenseId of settlement.expenseIds) {
      const participant = await this.findBundledParticipant(expenseId, settlement.fromUserId, settlement.toUserId);
      if (
        participant &&
        participant.status === "payment-submitted" &&
        participant.submittedAt &&
        participant.submittedAt <= cutoff
      ) {
        await this.confirmAndMaybeSettle(expenseId, participant.userId);
      }
    }

    await this.recomputeAmount(settlementId);
  }

  async markAllPaidForGroup(groupId: string, userId: string) {
    const settlements = await this.model.find({ groupId, status: "pending", fromUserId: userId });
    for (const settlement of settlements) {
      await this.submitOutstandingParticipants(settlement.expenseIds, settlement.fromUserId, settlement.toUserId);
      await this.updateById(settlement._id.toString(), { senderConfirmedAt: new Date() });
      await this.recomputeAmount(settlement._id.toString());
    }
    return this.getForUser(groupId, userId);
  }

  async approveAllForGroup(groupId: string, userId: string) {
    const settlements = await this.model.find({ groupId, status: "pending", toUserId: userId });
    for (const settlement of settlements) {
      await this.confirmSubmittedParticipants(settlement.expenseIds, settlement.fromUserId, settlement.toUserId);
      await this.recomputeAmount(settlement._id.toString());
    }
    return this.getForUser(groupId, userId);
  }

  /**
   * A netted settlement can bundle expenses from both debt directions
   * (A owed B on one expense, B owed A on another), so the participant row
   * that needs updating for a given bundled expense may belong to either
   * side of the settlement, not always `fromUserId`.
   */
  private async findBundledParticipant(expenseId: string, userA: string, userB: string) {
    return (
      (await expenseParticipantService.findOne({ expenseId, userId: userA })) ??
      (await expenseParticipantService.findOne({ expenseId, userId: userB }))
    );
  }

  private async submitOutstandingParticipants(expenseIds: string[], userA: string, userB: string) {
    for (const expenseId of expenseIds) {
      const participant = await this.findBundledParticipant(expenseId, userA, userB);
      if (participant && participant.status === "pending") {
        await expenseParticipantService.submitPayment(expenseId, participant.userId);
      }
    }
  }

  private async confirmSubmittedParticipants(expenseIds: string[], userA: string, userB: string) {
    for (const expenseId of expenseIds) {
      const participant = await this.findBundledParticipant(expenseId, userA, userB);
      if (participant && participant.status === "payment-submitted") {
        await this.confirmAndMaybeSettle(expenseId, participant.userId);
      }
    }
  }

  private async confirmAndMaybeSettle(expenseId: string, userId: string) {
    await expenseParticipantService.confirmPayment(expenseId, userId);

    const allConfirmed = await expenseParticipantService.allConfirmed(expenseId);
    if (allConfirmed) {
      await expenseService.updateById(expenseId, { status: "settled", settledAt: new Date() });
    }
  }
}

export const settlementService = new SettlementService();
