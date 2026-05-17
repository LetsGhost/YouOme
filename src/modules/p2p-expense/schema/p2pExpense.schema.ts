import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateP2PExpenseDTO:
 *       type: object
 *       required:
 *         - threadId
 *         - createdByUserId
 *         - title
 *         - totalAmount
 *       properties:
 *         threadId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         createdByUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         paidByUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         title:
 *           type: string
 *           example: Taxi home
 *         totalAmount:
 *           type: number
 *           example: 42
 *         splitType:
 *           type: string
 *           example: equal
 *     P2PExpense:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         threadId:
 *           type: string
 *         title:
 *           type: string
 *         totalAmount:
 *           type: number
 */

export const createP2PExpenseSchema = z.object({
  threadId: z.string(),
  createdByUserId: z.string(),
  paidByUserId: z.string().optional(),
  title: z.string(),
  totalAmount: z.number(),
  splitType: z.string().optional(),
});

export type CreateP2PExpenseDTO = z.infer<typeof createP2PExpenseSchema>;
