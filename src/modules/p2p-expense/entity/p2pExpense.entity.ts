import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class P2PExpenseEntity extends BaseModel {
  @prop({ required: true })
  threadId!: string;

  @prop({ required: true })
  createdByUserId!: string;

  @prop()
  paidByUserId?: string;

  @prop({ required: true })
  title!: string;

  @prop({ required: true })
  totalAmount!: number;

  @prop({ default: "equal" })
  splitType!: string;
}
