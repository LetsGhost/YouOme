import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class UserEntity extends BaseModel {
    @prop({ required: true, unique: true, index: true })
    email!: string;

    @prop({ required: true })
    password!: string; // hashed password

    @prop({ required: true })
    name!: string;

    @prop({ default: "user" })
    role!: string;

    @prop()
    suspendedAt?: Date;

    @prop()
    lastLoginAt?: Date;

    @prop({ default: true })
    emailNotificationsEnabled!: boolean;

    @prop()
    avatarKey?: string;
}