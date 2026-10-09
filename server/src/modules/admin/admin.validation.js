import { z } from 'zod';

export const adminShipmentListSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  }),
};

export const adminShipmentParamsSchema = {
  params: z.object({ id: z.uuid() }),
};
