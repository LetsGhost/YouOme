import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.string(),
  payload: z.record(z.any()).optional(),
});

export type CreateNotificationDTO = z.infer<typeof createNotificationSchema>;
