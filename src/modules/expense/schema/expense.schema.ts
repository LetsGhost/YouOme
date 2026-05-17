import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     ExpenseParticipantInput:
 *       type: object
 *       required:
 *         - userId
 *         - shareAmount
 *       properties:
 *         userId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         shareAmount:
 *           type: number
 *           minimum: 0
 *           example: 25
 *     CreateExpenseDTO:
 *       type: object
 *       required:
 *         - groupId
 *         - createdByUserId
 *         - title
 *         - totalAmount
 *       properties:
 *         groupId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         createdByUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         title:
 *           type: string
 *           example: Dinner at Luigi's
 *         totalAmount:
 *           type: number
 *           minimum: 0
 *           example: 100
 *         paidByUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         splitType:
 *           type: string
 *           example: equal
 *         note:
 *           type: string
 *           example: Friday team dinner
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ExpenseParticipantInput'
 *     Expense:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         groupId:
 *           type: string
 *         createdByUserId:
 *           type: string
 *         title:
 *           type: string
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 */

export const createExpenseSchema = z.object({
  groupId: z.string().min(1),
  createdByUserId: z.string().min(1),
  title: z.string().min(1),
  totalAmount: z.number().positive(),
  paidByUserId: z.string().optional(),
  splitType: z.string().optional(),
  note: z.string().optional(),
  participants: z.array(
    z.object({ userId: z.string().min(1), shareAmount: z.number().nonnegative() })
  ).optional(),
});

export const confirmParticipantSchema = z.object({});

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
