import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class CollaborationEntity extends BaseModel {
  @prop({ required: true })
  ownerUserId!: string;

  @prop({ required: true })
  collaboratorUserId!: string;

  @prop({ default: "viewer" })
  role!: string;
}
