import { prop } from "@typegoose/typegoose";

import { BaseEntity } from "../../common/base/base.entity";

export class CategorieEntity extends BaseEntity {
  @prop({ required: true, unique: true })
  userId!: string;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  type!: "income" | "expense";
}