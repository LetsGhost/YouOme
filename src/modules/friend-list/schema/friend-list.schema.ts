import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     AddFriendDTO:
 *       type: object
 *       required:
 *         - friendUserId
 *       properties:
 *         friendUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *     BlockFriendDTO:
 *       type: object
 *       required:
 *         - friendUserId
 *         - blocked
 *       properties:
 *         friendUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         blocked:
 *           type: boolean
 *           example: true
 *     FriendListEntry:
 *       type: object
 *       properties:
 *         friendUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         blocked:
 *           type: boolean
 *           example: false
 *     FriendList:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         friendUserIds:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FriendListEntry'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export const addFriendSchema = z.object({
  friendUserId: z.string().min(1, "Friend user ID is required"),
});

export type AddFriendDTO = z.infer<typeof addFriendSchema>;

export const blockFriendSchema = z.object({
  friendUserId: z.string().min(1, "Friend user ID is required"),
  blocked: z.boolean(),
});

export type BlockFriendDTO = z.infer<typeof blockFriendSchema>;
