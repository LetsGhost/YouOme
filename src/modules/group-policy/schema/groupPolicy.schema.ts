import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateGroupPolicyDTO:
 *       type: object
 *       required:
 *         - groupId
 *       properties:
 *         groupId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         canMembersInvite:
 *           type: boolean
 *         canEditorsAddExpense:
 *           type: boolean
 *         canModeratorsAddExpense:
 *           type: boolean
 *         visibilityMode:
 *           type: string
 *           example: members
 *         canViewParticipatedExpenseDetails:
 *           type: boolean
 *         requireReceiverConfirmationForSettlement:
 *           type: boolean
 *         allowMemberRoleSelfLeave:
 *           type: boolean
 *     GroupPolicy:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         groupId:
 *           type: string
 */

export const createGroupPolicySchema = z.object({
  groupId: z.string(),
  canMembersInvite: z.boolean().optional(),
  canEditorsAddExpense: z.boolean().optional(),
  canModeratorsAddExpense: z.boolean().optional(),
  visibilityMode: z.string().optional(),
  canViewParticipatedExpenseDetails: z.boolean().optional(),
  requireReceiverConfirmationForSettlement: z.boolean().optional(),
  allowMemberRoleSelfLeave: z.boolean().optional(),
});

export type CreateGroupPolicyDTO = z.infer<typeof createGroupPolicySchema>;

/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateGroupPolicyDTO:
 *       type: object
 *       properties:
 *         canMembersInvite:
 *           type: boolean
 *         canEditorsAddExpense:
 *           type: boolean
 *         canModeratorsAddExpense:
 *           type: boolean
 *         visibilityMode:
 *           type: string
 *           example: members
 *         canViewParticipatedExpenseDetails:
 *           type: boolean
 *         requireReceiverConfirmationForSettlement:
 *           type: boolean
 *         allowMemberRoleSelfLeave:
 *           type: boolean
 */

export const updateGroupPolicySchema = z.object({
  canMembersInvite: z.boolean().optional(),
  canEditorsAddExpense: z.boolean().optional(),
  canModeratorsAddExpense: z.boolean().optional(),
  visibilityMode: z.string().optional(),
  canViewParticipatedExpenseDetails: z.boolean().optional(),
  requireReceiverConfirmationForSettlement: z.boolean().optional(),
  allowMemberRoleSelfLeave: z.boolean().optional(),
});

export type UpdateGroupPolicyDTO = z.infer<typeof updateGroupPolicySchema>;
