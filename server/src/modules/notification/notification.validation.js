import { z } from 'zod';

export const notificationListSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    unreadOnly: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    type: z.string().trim().min(1).max(50).optional(),
  }),
};

export const notificationParamsSchema = {
  params: z.object({ id: z.string().uuid() }),
};

export const notificationReferenceParamsSchema = {
  params: z.object({ referenceId: z.string().uuid() }),
};
