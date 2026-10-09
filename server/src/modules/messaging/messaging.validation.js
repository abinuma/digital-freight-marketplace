import { z } from 'zod';

const shipmentId = z.uuid();

export const shipmentMessagesSchema = {
  params: z.object({ shipmentId }),
};

export const createMessageSchema = {
  params: z.object({ shipmentId }),
  body: z.object({
    content: z.string().trim().min(1).max(5000),
  }),
};
