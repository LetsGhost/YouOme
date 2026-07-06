import { BaseService } from "../../common/base/base.service";
import { SettlementRunModel } from "../model/settlementRun.model";
import { SettlementRunEntity } from "../entity/settlementRun.entity";

export class SettlementRunService extends BaseService<SettlementRunEntity> {
  constructor() {
    super(SettlementRunModel);
  }

  async listForGroup(groupId: string) {
    return this.model.find({ groupId }).sort({ createdAt: -1 });
  }

  async getOpenRunsPastDeadline(now: Date) {
    return this.model.find({ status: "open", graceDeadlineAt: { $lte: now } });
  }

  async getOpenRunsNearDeadline(from: Date, to: Date) {
    return this.model.find({
      status: "open",
      graceDeadlineAt: { $gte: from, $lte: to },
      deadlineReminderSentAt: { $exists: false },
    });
  }

  async markDeadlineReminderSent(runId: string) {
    await this.updateById(runId, { deadlineReminderSentAt: new Date() });
  }

  async close(runId: string, status: "completed" | "partially_completed") {
    return this.updateById(runId, { status, closedAt: new Date() });
  }
}

export const settlementRunService = new SettlementRunService();
