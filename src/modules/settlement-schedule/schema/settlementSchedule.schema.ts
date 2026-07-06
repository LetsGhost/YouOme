import { z } from "zod";

/**
 * @openapi
 * components:
 *   schemas:
 *     UpsertSettlementScheduleDTO:
 *       type: object
 *       required:
 *         - frequency
 *         - time
 *       properties:
 *         frequency:
 *           type: string
 *           enum: [weekly, monthly, quarterly]
 *         dayOfWeek:
 *           type: number
 *           minimum: 0
 *           maximum: 6
 *           description: Required when frequency is weekly (0 = Sunday)
 *         dayOfMonth:
 *           type: number
 *           minimum: 1
 *           maximum: 31
 *           description: Required when frequency is monthly or quarterly
 *         time:
 *           type: string
 *           example: "09:00"
 *         graceDays:
 *           type: number
 *           minimum: 1
 *           maximum: 14
 *         sendReminder:
 *           type: boolean
 *         autoApproveAfterDays:
 *           type: number
 *           minimum: 1
 *           maximum: 30
 *         autoApproveEnabled:
 *           type: boolean
 *     SettlementSchedule:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         groupId:
 *           type: string
 *         frequency:
 *           type: string
 *         dayOfWeek:
 *           type: number
 *         dayOfMonth:
 *           type: number
 *         time:
 *           type: string
 *         graceDays:
 *           type: number
 *         sendReminder:
 *           type: boolean
 *         autoApproveAfterDays:
 *           type: number
 *         autoApproveEnabled:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         nextRunAt:
 *           type: string
 *         lastRunAt:
 *           type: string
 */
export const upsertSettlementScheduleSchema = z
  .object({
    frequency: z.enum(["weekly", "monthly", "quarterly"]),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "time must be in HH:mm format"),
    graceDays: z.number().min(1).max(14).optional().default(2),
    sendReminder: z.boolean().optional().default(true),
    autoApproveAfterDays: z.number().min(1).max(30).optional().default(7),
    autoApproveEnabled: z.boolean().optional().default(true),
  })
  .refine((data) => data.frequency !== "weekly" || data.dayOfWeek !== undefined, {
    message: "dayOfWeek is required for a weekly schedule",
    path: ["dayOfWeek"],
  })
  .refine((data) => data.frequency === "weekly" || data.dayOfMonth !== undefined, {
    message: "dayOfMonth is required for monthly/quarterly schedules",
    path: ["dayOfMonth"],
  });

export type UpsertSettlementScheduleDTO = z.infer<typeof upsertSettlementScheduleSchema>;
