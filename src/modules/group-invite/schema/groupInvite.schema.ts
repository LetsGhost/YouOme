import { z } from "zod";

export const createGroupInviteSchema = z.object({
  groupId: z.string(),
  invitedUserId: z.string().optional(),
  invitedByUserId: z.string(),
  message: z.string().optional(),
  expiresAt: z.string().optional(),
});

export type CreateGroupInviteDTO = z.infer<typeof createGroupInviteSchema>;
