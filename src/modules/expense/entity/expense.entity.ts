import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class ExpenseEntity extends BaseModel {
  @prop({ required: true })
  groupId!: string;

  @prop({ required: true })
  createdByUserId!: string;

  @prop()
  paidByUserId?: string;

  @prop({ required: true })
  title!: string;

  @prop()
  note?: string;

  @prop({ required: true })
  totalAmount!: number;

  @prop({ default: "equal" })
  splitType!: string;

  @prop()
  expenseDate?: Date;

  @prop({ default: "pending_confirmations" })
  status!: string;

  @prop()
  settledAt?: Date;
}
