import { z } from "zod";

export const createGroupMemberSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  role: z.string().optional(),
  addedByUserId: z.string().optional(),
});

export type CreateGroupMemberDTO = z.infer<typeof createGroupMemberSchema>;
