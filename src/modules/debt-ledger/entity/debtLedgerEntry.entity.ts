import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class DebtLedgerEntryEntity extends BaseModel {
  @prop({ required: true })
  groupId!: string;

  @prop({ required: true })
  fromUserId!: string;

  @prop({ required: true })
  toUserId!: string;

  @prop({ required: true })
  amount!: number;

  @prop()
  sourceType?: string;

  @prop()
  sourceId?: string;
}
