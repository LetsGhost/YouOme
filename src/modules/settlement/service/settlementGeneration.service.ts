import { expenseService } from "../../expense/service/expense.service";
import { expenseParticipantService } from "../../expense-participant/service/expenseParticipant.service";
import { settlementScheduleService } from "../../settlement-schedule/service/settlementSchedule.service";
import { eventBus } from "../../common/messaging/event-bus";
import { settlementRunService } from "./settlementRun.service";
import { settlementService } from "./settlement.service";
import { SettlementRunCreatedEvent } from "../events/settlement-run-created.event";

const DEFAULT_GRACE_DAYS = 2;

interface PairAccumulator {
  userA: string;
  userB: string;
  aOwesB: number;
  bOwesA: number;
  expenseIds: Set<string>;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

export class SettlementGenerationService {
  /**
   * Bundles every expense flagged `includeInNextSettlement` (and not
   * already locked in another run) into pairwise-netted debts. Only pairs
   * with a non-zero net produce a SettlementEntity + lock their source
   * expenses; net-zero pairs are left untouched so their expenses stay
   * open for ordinary individual settlement.
   */
  async generateForGroup(
    groupId: string,
    options: { triggeredBy: "scheduled" | "manual"; triggeredByUserId?: string }
  ) {
    const candidateExpenses = await expenseService.findAll({
      groupId,
      includeInNextSettlement: true,
    });

    const eligibleExpenses = candidateExpenses.filter(
      (expense) => !expense.settlementLockedAt && expense.status !== "settled"
    );

    const pairs = new Map<string, PairAccumulator>();

    for (const expense of eligibleExpenses) {
      const creditorId = expense.paidByUserId || expense.createdByUserId;
      const participants = await expenseParticipantService.getByExpense(expense._id.toString());

      for (const participant of participants) {
        if (participant.status === "payment-confirmed") continue;
        if (participant.userId === creditorId) continue;
        if (participant.shareAmount <= 0) continue;

        const key = pairKey(participant.userId, creditorId);
        const entry = pairs.get(key) ?? {
          userA: participant.userId,
          userB: creditorId,
          aOwesB: 0,
          bOwesA: 0,
          expenseIds: new Set<string>(),
        };

        if (participant.userId === entry.userA) {
          entry.aOwesB += participant.shareAmount;
        } else {
          entry.bOwesA += participant.shareAmount;
        }
        entry.expenseIds.add(expense._id.toString());

        pairs.set(key, entry);
      }
    }

    const nonZeroPairs = Array.from(pairs.values())
      .map((entry) => {
        const net = entry.aOwesB - entry.bOwesA;
        return {
          fromUserId: net > 0 ? entry.userA : entry.userB,
          toUserId: net > 0 ? entry.userB : entry.userA,
          amount: Math.round(Math.abs(net) * 100) / 100,
          expenseIds: Array.from(entry.expenseIds),
        };
      })
      .filter((entry) => entry.amount > 0);

    if (nonZeroPairs.length === 0) {
      return null;
    }

    const schedule = await settlementScheduleService.getByGroupId(groupId);
    const graceDays = schedule?.graceDays ?? DEFAULT_GRACE_DAYS;
    const graceDeadlineAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);

    const run = await settlementRunService.create({
      groupId,
      triggeredBy: options.triggeredBy,
      triggeredByUserId: options.triggeredByUserId,
      status: "open",
      graceDeadlineAt,
    });
    const runId = run._id.toString();

    const lockedExpenseIds = new Set<string>();

    for (const pair of nonZeroPairs) {
      await settlementService.createSettlement(groupId, pair.fromUserId, pair.toUserId, pair.amount, {
        runId,
        expenseIds: pair.expenseIds,
      });
      pair.expenseIds.forEach((id) => lockedExpenseIds.add(id));
    }

    await Promise.all(
      Array.from(lockedExpenseIds).map((expenseId) =>
        expenseService.updateById(expenseId, { settlementLockedAt: new Date() })
      )
    );

    const event = new SettlementRunCreatedEvent(runId, {
      groupId,
      settlements: nonZeroPairs.map(({ fromUserId, toUserId, amount }) => ({ fromUserId, toUserId, amount })),
    });
    await eventBus.publish(event);

    return run;
  }
}

export const settlementGenerationService = new SettlementGenerationService();
