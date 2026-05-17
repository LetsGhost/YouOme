import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateCollaborationDTO:
 *       type: object
 *       required:
 *         - ownerUserId
 *         - collaboratorUserId
 *       properties:
 *         ownerUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         collaboratorUserId:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         role:
 *           type: string
 *           example: viewer
 *     Collaboration:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         ownerUserId:
 *           type: string
 *         collaboratorUserId:
 *           type: string
 *         role:
 *           type: string
 */

export const createCollaborationSchema = z.object({
  ownerUserId: z.string(),
  collaboratorUserId: z.string(),
  role: z.string().optional(),
});

export type CreateCollaborationDTO = z.infer<typeof createCollaborationSchema>;
