import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class GroupInviteEntity extends BaseModel {
  @prop({ required: true })
  groupId!: string;

  @prop()
  invitedUserId?: string;

  @prop()
  invitedByUserId?: string;

  @prop({ default: "pending" })
  status!: string;

  @prop()
  message?: string;

  @prop()
  expiresAt?: Date;

  @prop()
  actedAt?: Date;
}
