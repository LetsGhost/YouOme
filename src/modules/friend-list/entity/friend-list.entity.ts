import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class FriendListEntity extends BaseModel {
    @prop({ required: true, unique: true, index: true })
    userId!: string;

    @prop({ required: true, default: [] })
    friendUserIds!: FriendListEntryEntity[];
}

export class FriendListEntryEntity extends BaseModel {
    @prop({ required: true, unique: true, index: true })
    friendUserId!: string;

    @prop({ required: true, default: false })
    blocked!: boolean;
}