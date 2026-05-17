import {prop} from "@typegoose/typegoose";
import { ObjectId } from "mongoose";

import {BaseModel} from "../../common/base/base.model";

export class FriendListEntity extends BaseModel {
    @prop({ required: true, unique: true, index: true })
    userId!: ObjectId;

    @prop({ required: true, default: [] })
    friendUserIds!: FriendListEntryEntity[];
}

export class FriendListEntryEntity extends BaseModel {
    @prop({ required: true, unique: true, index: true })
    friendUserId!: ObjectId;

    @prop({ required: true, default: false })
    blocked!: boolean;
}