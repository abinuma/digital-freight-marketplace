import { z } from 'zod';

export const notificationListSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};

export const notificationParamsSchema = {
  params: z.object({ id: z.uuid() }),
};
