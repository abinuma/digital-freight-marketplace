import { Buffer } from 'node:buffer';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/shipment/shipment.service.js', () => ({
  createShipment: vi.fn(),
  listShipments: vi.fn(),
  getShipment: vi.fn(),
  updateShipment: vi.fn(),
  publishShipment: vi.fn(),
  cancelShipment: vi.fn(),
  completeShipment: vi.fn(),
  uploadShipmentImages: vi.fn(),
  removeShipmentImage: vi.fn(),
}));

import * as shipmentService from '../../../src/modules/shipment/shipment.service.js';
import shipmentRouter from '../../../src/modules/shipment/shipment.routes.js';
import { errorHandler } from '../../../src/shared/middleware/errorHandler.js';

const shipper = { id: 'f92b3d47-f7da-4a12-b2db-35d902438f23', role: 'SHIPPER' };
const transporter = { id: '0ecb5efc-f011-4fc9-92a8-96df1682e579', role: 'TRANSPORTER' };
const validPng = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

function createApp(user = shipper) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.use('/shipments', shipmentRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => vi.clearAllMocks());

describe('shipment routes', () => {
  it('creates a shipment and responds with 201', async () => {
    shipmentService.createShipment.mockResolvedValue({ id: 'shipment-id', status: 'DRAFT' });
    const payload = {
      goodsDescription: 'Household furniture shipment',
      goodsType: 'Furniture',
      weightKg: 125.5,
      volumeM3: 15.5,
      pickupLocation: 'Addis Ababa',
      deliveryLocation: 'Hawassa',
      pickupDate: '2099-10-10',
    };

    const response = await request(createApp()).post('/shipments').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ status: 'DRAFT' });
    expect(shipmentService.createShipment).toHaveBeenCalledWith(shipper.id, {
      ...payload,
      loadSize: 'FULL_LOAD',
    });
  });

  it('rejects shipment creation by a transporter', async () => {
    const response = await request(createApp(transporter)).post('/shipments').send({});

    expect(response.status).toBe(403);
    expect(shipmentService.createShipment).not.toHaveBeenCalled();
  });

  it('returns paginated shipment lists from the service', async () => {
    shipmentService.listShipments.mockResolvedValue({
      shipments: [{ id: 'shipment-id' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const response = await request(createApp(transporter)).get('/shipments?page=1&limit=20&pickupLocation=Addis');

    expect(response.status).toBe(200);
    expect(response.body.meta.pagination.total).toBe(1);
    expect(shipmentService.listShipments).toHaveBeenCalledWith(transporter, {
      page: 1,
      limit: 20,
      pickupLocation: 'Addis',
    });
  });

  it('passes validated multipart images to the upload service', async () => {
    shipmentService.uploadShipmentImages.mockResolvedValue([{ id: 'image-id', url: 'https://example.test/image.png' }]);

    const response = await request(createApp())
      .post('/shipments/0ecb5efc-f011-4fc9-92a8-96df1682e579/images')
      .attach('images', validPng, { filename: 'load.png', contentType: 'image/png' });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveLength(1);
    expect(shipmentService.uploadShipmentImages).toHaveBeenCalledWith(
      shipper,
      '0ecb5efc-f011-4fc9-92a8-96df1682e579',
      [expect.objectContaining({ mimetype: 'image/png' })],
    );
  });

  it('validates image route IDs before accepting an upload', async () => {
    const response = await request(createApp()).post('/shipments/not-a-uuid/images');

    expect(response.status).toBe(400);
    expect(shipmentService.uploadShipmentImages).not.toHaveBeenCalled();
  });
});
