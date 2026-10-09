import { z } from 'zod';

const bidId = z.uuid();

const futurePickupDate = z.iso
  .datetime({ offset: true })
  .refine((value) => new Date(value).getTime() > Date.now(), 'pickupDate must be in the future');

const bidFields = {
  price: z.number().positive().max(999_999_999_999.99),
  pickupDate: futurePickupDate,
  message: z.string().trim().max(5000),
};

export const createBidSchema = {
  params: z.object({ shipmentId: bidId }),
  body: z.object({
    price: bidFields.price,
    pickupDate: bidFields.pickupDate,
    message: bidFields.message.optional(),
  }),
};

const updateBidBody = z
  .object({
    price: bidFields.price.optional(),
    pickupDate: bidFields.pickupDate.optional(),
    message: bidFields.message.nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one bid field to update');

export const updateBidSchema = {
  params: z.object({ shipmentId: bidId, id: bidId }),
  body: updateBidBody,
};

export const declineBidSchema = {
  params: z.object({ shipmentId: bidId, id: bidId }),
  body: z.object({
    declineReason: z.string().trim().max(2000).optional(),
  }),
};

export const bidIdParamsSchema = {
  params: z.object({ shipmentId: bidId, id: bidId }),
};

export const bidListQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED']).optional(),
  }),
};

export const myBidsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN']).optional(),
  }),
};
