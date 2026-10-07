import { z } from 'zod';

const shipmentId = z.uuid();

const coordinate = (minimum, maximum) => z.number().min(minimum).max(maximum).optional();

export const createShipmentSchema = {
  body: z.object({
    goodsDescription: z.string().trim().min(10).max(1000),
    goodsType: z.string().trim().min(1).max(50),
    weightKg: z.number().positive().max(99_999_999.99),
    pickupLocation: z.string().trim().min(1).max(255),
    pickupLat: coordinate(-90, 90),
    pickupLng: coordinate(-180, 180),
    deliveryLocation: z.string().trim().min(1).max(255),
    deliveryLat: coordinate(-90, 90),
    deliveryLng: coordinate(-180, 180),
    pickupDate: z.iso.date(),
    specialRequirements: z.string().trim().max(2000).optional(),
  }),
};

const updateShipmentBody = z
  .object({
    goodsDescription: z.string().trim().min(10).max(1000).optional(),
    goodsType: z.string().trim().min(1).max(50).optional(),
    weightKg: z.number().positive().max(99_999_999.99).optional(),
    pickupLocation: z.string().trim().min(1).max(255).optional(),
    pickupLat: coordinate(-90, 90).nullable(),
    pickupLng: coordinate(-180, 180).nullable(),
    deliveryLocation: z.string().trim().min(1).max(255).optional(),
    deliveryLat: coordinate(-90, 90).nullable(),
    deliveryLng: coordinate(-180, 180).nullable(),
    pickupDate: z.iso.date().optional(),
    specialRequirements: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one shipment field to update');

export const updateShipmentSchema = {
  params: z.object({ id: shipmentId }),
  body: updateShipmentBody,
};

export const shipmentIdParamsSchema = {
  params: z.object({ id: shipmentId }),
};

export const shipmentListQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};
