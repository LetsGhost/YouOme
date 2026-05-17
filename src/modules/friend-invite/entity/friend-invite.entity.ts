import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class FriendInviteEntity extends BaseModel {
    @prop({ required: true })
    fromUserId!: string;

    @prop({ required: true })
    toUserId!: string;

    @prop({ default: "pending" })
    status!: "pending" | "accepted" | "rejected";
}