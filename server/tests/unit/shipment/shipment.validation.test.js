import { describe, expect, it } from 'vitest';
import {
  createShipmentSchema,
  shipmentListQuerySchema,
  shipmentImageParamsSchema,
  updateShipmentSchema,
} from '../../../src/modules/shipment/shipment.validation.js';

const validCreateBody = {
  goodsDescription: 'Household furniture shipment',
  goodsType: 'Furniture',
  weightKg: 125.5,
  pickupLocation: 'Addis Ababa',
  deliveryLocation: 'Hawassa',
  pickupDate: '2099-10-10',
};

describe('shipment validation schemas', () => {
  it('accepts valid shipment creation input', () => {
    expect(createShipmentSchema.body.safeParse(validCreateBody).success).toBe(true);
  });

  it('accepts partial shipment updates', () => {
    expect(
      updateShipmentSchema.body.safeParse({ goodsDescription: 'Updated furniture description' }).success,
    ).toBe(true);
  });

  it('accepts clearing optional location coordinates and special requirements', () => {
    expect(
      updateShipmentSchema.body.safeParse({ pickupLat: null, pickupLng: null, specialRequirements: null }).success,
    ).toBe(true);
  });

  it('rejects empty or invalid update bodies', () => {
    expect(updateShipmentSchema.body.safeParse({}).success).toBe(false);
    expect(updateShipmentSchema.body.safeParse({ weightKg: 0 }).success).toBe(false);
  });

  it('rejects coordinates outside geographic bounds', () => {
    expect(updateShipmentSchema.body.safeParse({ pickupLat: 91 }).success).toBe(false);
  });

  it('accepts valid discovery filters and pagination', () => {
    const result = shipmentListQuerySchema.query.safeParse({
      page: '2',
      limit: '10',
      pickupLocation: 'Addis',
      deliveryLocation: 'Hawassa',
      goodsType: 'Furniture',
      pickupDateFrom: '2026-10-10',
      pickupDateTo: '2026-10-20',
      q: 'fragile',
      sortBy: 'pickupDate',
    });
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(2);
  });

  it('rejects inverted date ranges and unsupported sorting values', () => {
    expect(
      shipmentListQuerySchema.query.safeParse({ pickupDateFrom: '2026-10-20', pickupDateTo: '2026-10-10' }).success,
    ).toBe(false);
    expect(shipmentListQuerySchema.query.safeParse({ sortBy: 'distance' }).success).toBe(false);
  });

  it('validates shipment and image IDs for image removal', () => {
    expect(
      shipmentImageParamsSchema.params.safeParse({
        id: 'f92b3d47-f7da-4a12-b2db-35d902438f23',
        imageId: '0ecb5efc-f011-4fc9-92a8-96df1682e579',
      }).success,
    ).toBe(true);
    expect(shipmentImageParamsSchema.params.safeParse({ id: 'bad', imageId: 'bad' }).success).toBe(false);
  });
});
