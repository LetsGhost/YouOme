import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class SettlementRunEntity extends BaseModel {
  @prop({ required: true })
  groupId!: string;

  @prop({ required: true })
  triggeredBy!: string;

  @prop()
  triggeredByUserId?: string;

  @prop({ default: "open" })
  status!: string;

  @prop({ required: true })
  graceDeadlineAt!: Date;

  @prop()
  deadlineReminderSentAt?: Date;

  @prop()
  closedAt?: Date;
}
