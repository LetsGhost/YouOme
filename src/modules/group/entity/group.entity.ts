import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class GroupEntity extends BaseModel {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  createdByUserId!: string;

  @prop()
  baseCurrency?: string;

  @prop({ default: false })
  isArchived!: boolean;

  @prop()
  deletedAt?: Date;
}
