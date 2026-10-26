import { z } from "zod";

const shipmentId = z.uuid();

const reviewPaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createShipmentReviewSchema = {
  params: z.object({ shipmentId }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().nullable().optional(),
  }),
};

export const shipmentReviewsSchema = {
  params: z.object({ shipmentId }),
  query: reviewPaginationSchema,
};
