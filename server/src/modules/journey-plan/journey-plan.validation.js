import { z } from 'zod';

const planId = z.uuid();
const bidId = z.uuid();

const departureDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'departureDate must be YYYY-MM-DD')
  .refine((date) => date >= new Date().toISOString().slice(0, 10), 'departureDate must be today or later');

export const createJourneyPlanSchema = {
  body: z.object({
    originCity: z.string().trim().min(1, 'Origin city is required').max(100),
    destinationCity: z.string().trim().min(1, 'Destination city is required').max(100),
    departureDate,
    fullLoadPrice: z.coerce.number().positive('Full load price must be greater than zero').max(999_999_999_999.99),
  }),
};

export const assignBidSchema = {
  params: z.object({ id: planId }),
  body: z.object({
    bidId,
  }),
};

export const journeyPlanIdParamsSchema = {
  params: z.object({ id: planId }),
};

export const listJourneyPlansQuerySchema = {
  query: z.object({
    status: z.enum(['ACTIVE', 'FULL', 'COMPLETED', 'CANCELLED']).optional(),
  }),
};
