import { z } from "zod";

export const createP2PThreadSchema = z.object({
  userAId: z.string(),
  userBId: z.string(),
  baseCurrency: z.string().optional(),
});

export type CreateP2PThreadDTO = z.infer<typeof createP2PThreadSchema>;
