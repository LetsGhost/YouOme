import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateGroupInviteDTO:
 *       type: object
 *       required:
 *         - groupId
 *       properties:
 *         groupId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         invitedUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         message:
 *           type: string
 *           example: Join our travel group
 *         expiresAt:
 *           type: string
 *           format: date-time
 *     GroupInvite:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         groupId:
 *           type: string
 *         invitedUserId:
 *           type: string
 *         status:
 *           type: string
 */

export const createGroupInviteSchema = z.object({
  groupId: z.string(),
  invitedUserId: z.string().optional(),
  message: z.string().optional(),
  expiresAt: z.string().optional(),
});

export type CreateGroupInviteDTO = z.infer<typeof createGroupInviteSchema>;
