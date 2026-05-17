import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateP2PThreadDTO:
 *       type: object
 *       required:
 *         - userAId
 *         - userBId
 *       properties:
 *         userAId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         userBId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         baseCurrency:
 *           type: string
 *           example: EUR
 *     P2PThread:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userAId:
 *           type: string
 *         userBId:
 *           type: string
 *         baseCurrency:
 *           type: string
 */

export const createP2PThreadSchema = z.object({
  userAId: z.string(),
  userBId: z.string(),
  baseCurrency: z.string().optional(),
});

export type CreateP2PThreadDTO = z.infer<typeof createP2PThreadSchema>;
