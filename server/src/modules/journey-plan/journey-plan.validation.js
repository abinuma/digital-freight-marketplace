import { z } from "zod";

const planId = z.uuid();
const bidId = z.uuid();

const departureDate = z
  .string()
  .refine(
    (date) => !Number.isNaN(new Date(date).getTime()),
    "departureDate must be a valid date or datetime",
  )
  .refine((date) => {
    const today = new Date().toISOString().slice(0, 10);
    const datePart = date.slice(0, 10);
    return datePart >= today;
  }, "departureDate must be today or later");

export const createJourneyPlanSchema = {
  body: z.object({
    originCity: z.string().trim().min(1, "Origin city is required").max(100),
    destinationCity: z
      .string()
      .trim()
      .min(1, "Destination city is required")
      .max(100),
    departureDate,
    fullLoadPrice: z.coerce
      .number()
      .positive("Full load price must be greater than zero")
      .max(999_999_999_999.99),
  }),
};

export const updateJourneyPlanSchema = {
  params: z.object({ id: planId }),
  body: z.object({
    originCity: z.string().trim().min(1, "Origin city is required").max(100),
    destinationCity: z
      .string()
      .trim()
      .min(1, "Destination city is required")
      .max(100),
    departureDate,
    fullLoadPrice: z.coerce
      .number()
      .positive("Full load price must be greater than zero")
      .max(999_999_999_999.99),
  }),
};

export const deleteJourneyPlanSchema = { params: z.object({ id: planId }) };

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
    status: z.enum(["ACTIVE", "FULL", "COMPLETED", "CANCELLED"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};
