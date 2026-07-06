import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     ExpenseParticipantInput:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         shareAmount:
 *           type: number
 *           minimum: 0
 *           example: 25
 *         sharePercent:
 *           type: number
 *           minimum: 0
 *           maximum: 100
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
 *           enum: [equal, custom, percentage]
 *           example: equal
 *         note:
 *           type: string
 *           example: Friday team dinner
 *         includeInNextSettlement:
 *           type: boolean
 *           default: true
 *           example: true
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
 *           enum: [pending, payment-submitted, payment-confirmed, settled]
 */

export const createExpenseSchema = z.object({
  groupId: z.string().min(1),
  createdByUserId: z.string().min(1),
  title: z.string().min(1),
  totalAmount: z.number().positive(),
  paidByUserId: z.string().optional(),
  splitType: z.enum(["equal", "custom", "percentage"]).optional().default("equal"),
  note: z.string().optional(),
  includeInNextSettlement: z.boolean().optional().default(true),
  participants: z.array(
    z.object({
      userId: z.string().min(1),
      shareAmount: z.number().nonnegative().optional(),
      sharePercent: z.number().min(0).max(100).optional(),
    })
  ).optional(),
});

export const submitPaymentSchema = z.object({
  comment: z.string().optional(),
});

/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateExpenseDTO:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *         totalAmount:
 *           type: number
 *           minimum: 0
 *         note:
 *           type: string
 */
export const updateExpenseSchema = z
  .object({
    title: z.string().min(1).optional(),
    totalAmount: z.number().positive().optional(),
    note: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

/**
 * @openapi
 * components:
 *   schemas:
 *     SetIncludeInSettlementDTO:
 *       type: object
 *       required:
 *         - include
 *       properties:
 *         include:
 *           type: boolean
 */
export const setIncludeInSettlementSchema = z.object({
  include: z.boolean(),
});

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
export type SubmitPaymentDTO = z.infer<typeof submitPaymentSchema>;
export type UpdateExpenseDTO = z.infer<typeof updateExpenseSchema>;
export type SetIncludeInSettlementDTO = z.infer<typeof setIncludeInSettlementSchema>;
