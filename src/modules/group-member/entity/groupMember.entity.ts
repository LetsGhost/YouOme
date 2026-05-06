import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class GroupMemberEntity extends BaseModel {
  @prop({ required: true })
  groupId!: string;

  @prop({ required: true })
  userId!: string;

  @prop({ default: "member" })
  role!: string;

  @prop()
  addedByUserId?: string;

  @prop()
  removedAt?: Date;
}
