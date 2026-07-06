import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class SettlementEntity extends BaseModel {
  @prop({ required: true })
  groupId!: string;

  @prop({ required: true })
  fromUserId!: string;

  @prop({ required: true })
  toUserId!: string;

  @prop({ required: true })
  amount!: number;

  @prop()
  settledAmount?: number;

  @prop({ default: "pending" })
  status!: string;

  @prop()
  senderConfirmedAt?: Date;

  @prop()
  receiverDecisionAt?: Date;

  @prop()
  receiverDecisionReason?: string;

  @prop()
  expiresAt?: Date;

  @prop()
  runId?: string;

  @prop({ type: () => [String], default: [] })
  expenseIds!: string[];

  @prop()
  completedAt?: Date;
}
