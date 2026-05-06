import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class NotificationEntity extends BaseModel {
  @prop({ required: true })
  userId!: string;

  @prop({ required: true })
  type!: string;

  @prop({ type: Object })
  payload?: Record<string, unknown>;

  @prop()
  readAt?: Date;
}
