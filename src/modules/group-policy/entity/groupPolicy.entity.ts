import { prop } from "@typegoose/typegoose";

import { BaseModel } from "../../common/base/base.model";

export class GroupPolicyEntity extends BaseModel {
  @prop({ required: true })
  groupId!: string;

  @prop({ default: false })
  canMembersInvite!: boolean;

  @prop({ default: false })
  canEditorsAddExpense!: boolean;

  @prop({ default: false })
  canModeratorsAddExpense!: boolean;

  @prop({ default: "private" })
  visibilityMode!: string;

  @prop({ default: false })
  canViewParticipatedExpenseDetails!: boolean;

  @prop({ default: false })
  requireReceiverConfirmationForSettlement!: boolean;

  @prop({ default: true })
  allowMemberRoleSelfLeave!: boolean;
}
