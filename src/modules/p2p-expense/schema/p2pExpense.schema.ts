import { z } from "zod";

export const createP2PExpenseSchema = z.object({
  threadId: z.string(),
  createdByUserId: z.string(),
  paidByUserId: z.string().optional(),
  title: z.string(),
  totalAmount: z.number(),
  splitType: z.string().optional(),
});

export type CreateP2PExpenseDTO = z.infer<typeof createP2PExpenseSchema>;
