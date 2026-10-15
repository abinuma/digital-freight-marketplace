import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const { shipper } = vi.hoisted(() => ({
  shipper: { id: 'f92b3d47-f7da-4a12-b2db-35d902438f23', role: 'SHIPPER' },
}));

vi.mock('../../../src/modules/auth/auth.routes.js', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});

vi.mock('../../../src/modules/users/user.routes.js', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});

vi.mock('../../../src/shared/middleware/authenticate.js', () => ({
  authenticate(req, res, next) {
    req.user = shipper;
    return next();
  },
}));

vi.mock('../../../src/shared/middleware/requireProfileComplete.js', () => ({
  requireProfileComplete(req, res, next) {
    return next();
  },
}));

vi.mock('../../../src/modules/shipment/shipment.service.js', () => ({
  createShipment: vi.fn().mockResolvedValue({ id: 'shipment-id', status: 'DRAFT' }),
  listShipments: vi.fn(),
  getShipment: vi.fn(),
  updateShipment: vi.fn(),
  publishShipment: vi.fn(),
  cancelShipment: vi.fn(),
  completeShipment: vi.fn(),
  uploadShipmentImages: vi.fn(),
  removeShipmentImage: vi.fn(),
}));

import apiRouter from '../../../src/index.js';
import * as shipmentService from '../../../src/modules/shipment/shipment.service.js';

describe('shipment API integration', () => {
  it('mounts shipment routes under the authenticated /api/v1 API router', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1', apiRouter);

    const response = await request(app).post('/api/v1/shipments').send({
      goodsDescription: 'Household furniture shipment',
      goodsType: 'Furniture',
      weightKg: 125.5,
      pickupLocation: 'Addis Ababa',
      deliveryLocation: 'Hawassa',
      pickupDate: '2099-10-10',
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ id: 'shipment-id', status: 'DRAFT' });
    expect(shipmentService.createShipment).toHaveBeenCalledWith(shipper.id, expect.objectContaining({ goodsType: 'Furniture' }));
  });
});
