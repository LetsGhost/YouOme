import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class SettlementScheduleEntity extends BaseModel {
  @prop({ required: true, unique: true })
  groupId!: string;

  @prop({ default: "weekly" })
  frequency!: string;

  @prop()
  dayOfWeek?: number;

  @prop()
  dayOfMonth?: number;

  @prop({ default: "09:00" })
  time!: string;

  @prop({ default: 2 })
  graceDays!: number;

  @prop({ default: true })
  sendReminder!: boolean;

  @prop({ default: 7 })
  autoApproveAfterDays!: number;

  @prop({ default: true })
  autoApproveEnabled!: boolean;

  @prop({ default: false })
  isActive!: boolean;

  @prop()
  nextRunAt?: Date;

  @prop()
  lastRunAt?: Date;
}
