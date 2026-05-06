import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class P2PThreadEntity extends BaseModel {
  @prop({ required: true })
  userAId!: string;

  @prop({ required: true })
  userBId!: string;

  @prop()
  baseCurrency?: string;
}
