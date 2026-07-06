import { BaseService } from "../../common/base/base.service";
import { SettlementScheduleModel } from "../model/settlementSchedule.model";
import { SettlementScheduleEntity } from "../entity/settlementSchedule.entity";
import { UpsertSettlementScheduleDTO } from "../schema/settlementSchedule.schema";
import { computeNextRunAt } from "./schedule-math";

export class SettlementScheduleService extends BaseService<SettlementScheduleEntity> {
  constructor() {
    super(SettlementScheduleModel);
  }

  async getByGroupId(groupId: string) {
    return this.model.findOne({ groupId });
  }

  async upsertSchedule(groupId: string, dto: UpsertSettlementScheduleDTO) {
    const nextRunAt = computeNextRunAt(dto, new Date());

    const existing = await this.getByGroupId(groupId);
    if (existing) {
      existing.set({ ...dto, isActive: true, nextRunAt });
      await existing.save();
      return existing;
    }

    return this.create({ groupId, ...dto, isActive: true, nextRunAt });
  }

  async deactivate(groupId: string) {
    const schedule = await this.model.findOneAndUpdate(
      { groupId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!schedule) {
      throw new Error("No schedule found for this group");
    }

    return schedule;
  }

  async findDue(now: Date) {
    return this.model.find({ isActive: true, nextRunAt: { $lte: now } });
  }

  async recordRun(scheduleId: string, ranAt: Date) {
    const schedule = await this.model.findById(scheduleId);
    if (!schedule) {
      return null;
    }

    const nextRunAt = computeNextRunAt(schedule, ranAt);
    schedule.set({ lastRunAt: ranAt, nextRunAt });
    await schedule.save();
    return schedule;
  }
}

export const settlementScheduleService = new SettlementScheduleService();
