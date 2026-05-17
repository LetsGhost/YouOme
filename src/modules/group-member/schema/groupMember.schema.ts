import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateGroupMemberDTO:
 *       type: object
 *       required:
 *         - groupId
 *         - userId
 *       properties:
 *         groupId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         userId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         role:
 *           type: string
 *           example: member
 *     GroupMember:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         groupId:
 *           type: string
 *         userId:
 *           type: string
 *         role:
 *           type: string
 */

export const createGroupMemberSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  role: z.string().optional(),
});

export type CreateGroupMemberDTO = z.infer<typeof createGroupMemberSchema>;
