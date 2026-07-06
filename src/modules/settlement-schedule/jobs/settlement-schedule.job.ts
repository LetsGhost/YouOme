import { ScheduledJob, JobContext } from "../../common/scheduler/job";
import { jobScheduler } from "../../common/scheduler/scheduler";
import { logger } from "../../common/logger/logger";
import { settlementScheduleService } from "../service/settlementSchedule.service";
import { settlementGenerationService } from "../../settlement/service/settlementGeneration.service";
import { settlementRunService } from "../../settlement/service/settlementRun.service";
import { settlementService } from "../../settlement/service/settlement.service";
import { expenseService } from "../../expense/service/expense.service";
import { notificationService } from "../../notification/service/notification.service";

const DEADLINE_REMINDER_LEAD_MS = 12 * 60 * 60 * 1000;

export class SettlementScheduleTickJob extends ScheduledJob {
  constructor() {
    super({
      name: "settlement-schedule-tick",
      schedule: "*/15 * * * *",
      enabled: true,
      runOnStartup: false,
    });
  }

  async execute(context: JobContext): Promise<void> {
    const log = logger.child({ label: "settlement-schedule-job" });
    const now = new Date();

    await this.fireDueSchedules(now, log);
    await this.autoApproveStaleClaims(now, log);
    await this.sendDeadlineReminders(now, log);
    await this.closeExpiredRuns(now, log);

    log.info("Settlement schedule tick completed", { jobId: context.jobId });
  }

  private async fireDueSchedules(now: Date, log: ReturnType<typeof logger.child>) {
    const dueSchedules = await settlementScheduleService.findDue(now);

    for (const schedule of dueSchedules) {
      try {
        await settlementGenerationService.generateForGroup(schedule.groupId, { triggeredBy: "scheduled" });
        await settlementScheduleService.recordRun(schedule._id.toString(), now);
      } catch (error) {
        log.error(`Failed to fire scheduled settlement for group ${schedule.groupId}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async autoApproveStaleClaims(now: Date, log: ReturnType<typeof logger.child>) {
    const schedules = await settlementScheduleService.findAll({ isActive: true, autoApproveEnabled: true });

    for (const schedule of schedules) {
      const cutoff = new Date(now.getTime() - schedule.autoApproveAfterDays * 24 * 60 * 60 * 1000);
      const openSettlements = await settlementService.getOpenForGroup(schedule.groupId);

      for (const settlement of openSettlements) {
        try {
          await settlementService.autoApproveStaleForSettlement(settlement._id.toString(), cutoff);
        } catch (error) {
          log.error(`Failed to auto-approve stale claims for settlement ${settlement._id.toString()}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  private async sendDeadlineReminders(now: Date, log: ReturnType<typeof logger.child>) {
    const nearDeadlineRuns = await settlementRunService.getOpenRunsNearDeadline(
      now,
      new Date(now.getTime() + DEADLINE_REMINDER_LEAD_MS)
    );

    for (const run of nearDeadlineRuns) {
      try {
        const settlements = await settlementService.getByRun(run._id.toString());
        const debtorIds = new Set(settlements.filter((s) => s.status === "pending").map((s) => s.fromUserId));

        await Promise.all(
          Array.from(debtorIds).map((userId) =>
            notificationService.createNotification(userId, "settlement.deadline_approaching", {
              groupId: run.groupId,
              runId: run._id.toString(),
              graceDeadlineAt: run.graceDeadlineAt,
            })
          )
        );

        await settlementRunService.markDeadlineReminderSent(run._id.toString());
      } catch (error) {
        log.error(`Failed to send deadline reminder for run ${run._id.toString()}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async closeExpiredRuns(now: Date, log: ReturnType<typeof logger.child>) {
    const expiredRuns = await settlementRunService.getOpenRunsPastDeadline(now);

    for (const run of expiredRuns) {
      try {
        const settlements = await settlementService.getByRun(run._id.toString());
        const incomplete = settlements.filter((s) => s.status === "pending");

        const expenseIdsToUnlock = new Set<string>();
        for (const settlement of incomplete) {
          await settlementService.updateById(settlement._id.toString(), { status: "expired" });
          settlement.expenseIds.forEach((id) => expenseIdsToUnlock.add(id));
        }

        for (const expenseId of expenseIdsToUnlock) {
          const expense = await expenseService.findById(expenseId);
          if (expense && expense.status !== "settled") {
            await expenseService.updateById(expenseId, { $unset: { settlementLockedAt: "" } });
          }
        }

        await settlementRunService.close(
          run._id.toString(),
          incomplete.length === 0 ? "completed" : "partially_completed"
        );
      } catch (error) {
        log.error(`Failed to close expired settlement run ${run._id.toString()}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

export const settlementScheduleTickJob = new SettlementScheduleTickJob();

jobScheduler.registerJob(settlementScheduleTickJob);
