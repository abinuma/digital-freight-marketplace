import { describe, expect, it } from 'vitest';
import { createShipmentSchema, updateShipmentSchema } from '../../../src/modules/shipment/shipment.validation.js';

const validCreateBody = {
  goodsDescription: 'Household furniture shipment',
  goodsType: 'Furniture',
  weightKg: 125.5,
  pickupLocation: 'Addis Ababa',
  deliveryLocation: 'Hawassa',
  pickupDate: '2026-10-10',
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
});
