import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class AuthLoginAuditEntity extends BaseModel {
  @prop({ required: true })
  userId!: string;

  @prop({ required: true })
  email!: string;

  @prop({ required: true })
  success!: boolean;

  @prop()
  failureReason?: string;

  @prop()
  ipAddress?: string;

  @prop()
  userAgent?: string;
}
