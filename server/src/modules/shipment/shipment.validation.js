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

export const shipmentIdParamsSchema = {
  params: z.object({ id: shipmentId }),
};

export const shipmentListQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};
