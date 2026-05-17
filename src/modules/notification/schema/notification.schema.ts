import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateNotificationDTO:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *       properties:
 *         userId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         type:
 *           type: string
 *           example: expense.created
 *         payload:
 *           type: object
 *           additionalProperties: true
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         type:
 *           type: string
 *         read:
 *           type: boolean
 */

export const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type CreateNotificationDTO = z.infer<typeof createNotificationSchema>;
