import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateFriendInviteDTO:
 *       type: object
 *       required:
 *         - toUserEmail
 *       properties:
 *         toUserEmail:
 *           type: string
 *           format: email
 *           example: friend@example.com
 *     RespondToFriendInviteDTO:
 *       type: object
 *       required:
 *         - accept
 *       properties:
 *         accept:
 *           type: boolean
 *           example: true
 *     FriendInvite:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439013
 *         fromUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         toUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export const createFriendInviteSchema = z.object({
    toUserEmail: z.string().email(),
});