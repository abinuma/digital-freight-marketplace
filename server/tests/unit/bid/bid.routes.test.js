import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { currentUser, bidService } = vi.hoisted(() => ({
  currentUser: { id: 'f92b3d47-f7da-4a12-b2db-35d902438f23', role: 'TRANSPORTER' },
  bidService: {
    createBid: vi.fn(),
    listShipmentBids: vi.fn(),
    listMyBids: vi.fn(),
    getBid: vi.fn(),
    updateBid: vi.fn(),
    withdrawBid: vi.fn(),
    acceptBid: vi.fn(),
    declineBid: vi.fn(),
  },
}));

vi.mock('../../../src/modules/auth/auth.routes.js', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});
vi.mock('../../../src/modules/users/user.routes.js', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});
vi.mock('../../../src/modules/shipment/shipment.routes.js', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});
vi.mock('../../../src/modules/admin/admin.routes.js', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});
vi.mock('../../../src/modules/notification/notification.routes.js', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});
vi.mock('../../../src/shared/middleware/authenticate.js', () => ({
  authenticate(req, res, next) {
    req.user = currentUser;
    return next();
  },
}));
vi.mock('../../../src/shared/middleware/requireProfileComplete.js', () => ({
  requireProfileComplete(req, res, next) { return next(); },
}));
vi.mock('../../../src/modules/bid/bid.service.js', () => bidService);

import apiRouter from '../../../src/index.js';

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);

beforeEach(() => {
  vi.clearAllMocks();
  currentUser.role = 'TRANSPORTER';
});

describe('bid API routes', () => {
  it('validates and forwards bid submission under the shipment route', async () => {
    const shipmentId = '0ecb5efc-f011-4fc9-92a8-96df1682e579';
    const bid = { id: '2cf3e1cd-024e-4acf-a20c-fd6cc08f0f4f', status: 'PENDING' };
    bidService.createBid.mockResolvedValue(bid);

    const response = await request(app)
      .post(`/api/v1/shipments/${shipmentId}/bids`)
      .send({ price: 4500, pickupDate: '2027-02-01T09:00:00.000Z', message: 'Ready to transport' });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(bid);
    expect(bidService.createBid).toHaveBeenCalledWith(currentUser, shipmentId, expect.objectContaining({ price: 4500 }));
  });

  it('rejects invalid bid payloads before reaching the service', async () => {
    const shipmentId = '0ecb5efc-f011-4fc9-92a8-96df1682e579';

    const response = await request(app).post(`/api/v1/shipments/${shipmentId}/bids`).send({ price: -1 });

    expect(response.status).toBe(400);
    expect(bidService.createBid).not.toHaveBeenCalled();
  });

  it('returns paginated bid lists with the documented response envelope', async () => {
    const shipmentId = '0ecb5efc-f011-4fc9-92a8-96df1682e579';
    bidService.listShipmentBids.mockResolvedValue({
      bids: [{ id: '2cf3e1cd-024e-4acf-a20c-fd6cc08f0f4f' }],
      pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });

    const response = await request(app).get(`/api/v1/shipments/${shipmentId}/bids?page=2&limit=10&status=PENDING`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [{ id: '2cf3e1cd-024e-4acf-a20c-fd6cc08f0f4f' }],
      meta: { pagination: { page: 2, limit: 10, total: 11, totalPages: 2 } },
    });
    expect(bidService.listShipmentBids).toHaveBeenCalledWith(currentUser, shipmentId, { page: 2, limit: 10, status: 'PENDING' });
  });

  it('restricts the personal bid list route to transporters', async () => {
    currentUser.role = 'SHIPPER';

    const response = await request(app).get('/api/v1/bids/my');

    expect(response.status).toBe(403);
    expect(bidService.listMyBids).not.toHaveBeenCalled();
  });
});
