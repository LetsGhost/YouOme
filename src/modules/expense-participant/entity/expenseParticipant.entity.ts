import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class ExpenseParticipantEntity extends BaseModel {
  @prop({ required: true })
  expenseId!: string;

  @prop({ required: true })
  userId!: string;

  @prop({ default: 0 })
  shareAmount!: number;

  @prop({ default: 0 })
  sharePercent!: number;

  @prop({ default: "pending" })
  status!: string;

  @prop()
  paidAt?: Date;
}
