import { z } from "zod";

export const createCollaborationSchema = z.object({
  ownerUserId: z.string(),
  collaboratorUserId: z.string(),
  role: z.string().optional(),
});

export type CreateCollaborationDTO = z.infer<typeof createCollaborationSchema>;
