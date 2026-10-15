import { z } from 'zod';

const userId = z.uuid();

export const userIdParamsSchema = {
  params: z.object({ id: userId }),
};

export const updateProfileSchema = {
  params: z.object({ id: userId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(100).optional(),
      phone: z.string().trim().min(7).max(20).optional(),
      location: z.string().trim().min(1).max(255).nullable().optional(),
      region: z.string().trim().max(100).nullable().optional(),
      zone: z.string().trim().max(100).nullable().optional(),
      city: z.string().trim().max(100).nullable().optional(),
      profilePhoto: z.string().url().max(500).nullable().optional(),
      availableDays: z.array(z.string().trim()).optional(),
      preferredLoadTypes: z.array(z.string().trim()).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one profile field to update'),
};

export const paginationQuerySchema = {
  params: z.object({ id: userId }),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};

export const upsertVehicleSchema = {
  params: z.object({ id: userId }),
  body: z.object({
    type: z.string().trim().min(1).max(50),
    capacityTons: z.number().positive().max(99_999_999.99),
    volumeM3: z.number().positive().max(99_999_999.99).nullable().optional(),
    plateNumber: z.string().trim().min(1).max(20),
  }),
};
