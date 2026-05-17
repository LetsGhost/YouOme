import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateGroupDTO:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 120
 *           example: Trip to Berlin
 *         baseCurrency:
 *           type: string
 *           minLength: 3
 *           maxLength: 10
 *           example: EUR
 *     Group:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         baseCurrency:
 *           type: string
 */

export const createGroupSchema = z.object({
  name: z.string().min(1).max(120),
  baseCurrency: z.string().min(3).max(10).optional(),
});

export type CreateGroupDTO = z.infer<typeof createGroupSchema>;