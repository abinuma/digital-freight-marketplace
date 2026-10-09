import { z } from 'zod';

export const adminShipmentListSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  }),
};

export const adminShipmentRemoveSchema = {
  params: z.object({ id: z.uuid() }),
  body: z.object({ reason: z.string().trim().min(1).max(500) }),
};

export const adminUserListSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    q: z.string().trim().max(100).optional(),
    role: z.enum(['SHIPPER', 'TRANSPORTER', 'ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  }),
};

export const adminUserParamsSchema = {
  params: z.object({ id: z.uuid() }),
};

export const adminUserSuspendSchema = {
  params: z.object({ id: z.uuid() }),
  body: z.object({ reason: z.string().trim().min(1).max(500) }),
};
