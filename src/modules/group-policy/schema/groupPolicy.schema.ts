import { z } from "zod";

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
