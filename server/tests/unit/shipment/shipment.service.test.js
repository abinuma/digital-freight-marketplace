import { Buffer } from 'node:buffer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/shipment/shipment.repository.js', () => ({
  createShipment: vi.fn(),
  findShipments: vi.fn(),
  findShipmentById: vi.fn(),
  softRemoveShipmentWithAudit: vi.fn(),
  findShipmentForUpdate: vi.fn(),
  findShipmentStatusById: vi.fn(),
  findShipmentAfterTransition: vi.fn(),
  transitionShipment: vi.fn(),
  cancelShipmentAndDeclinePendingBids: vi.fn(),
  updateShipment: vi.fn(),
  countShipmentImages: vi.fn(),
  createShipmentImages: vi.fn(),
  findShipmentImage: vi.fn(),
  deleteShipmentImage: vi.fn(),
  hasTransporterBid: vi.fn(),
  countActiveBidsByShipment: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../src/modules/notification/notification.service.js', () => ({
  shipmentCompleted: vi.fn(),
  shipmentRemoved: vi.fn(),
}));

vi.mock('../../../src/modules/shipment/shipment.storage.js', () => ({
  uploadShipmentImage: vi.fn(),
  deleteUploadedImages: vi.fn(),
  deleteShipmentImage: vi.fn(),
}));

import * as shipmentRepository from '../../../src/modules/shipment/shipment.repository.js';
import * as shipmentStorage from '../../../src/modules/shipment/shipment.storage.js';
import * as shipmentService from '../../../src/modules/shipment/shipment.service.js';

const draft = {
  id: '0ecb5efc-f011-4fc9-92a8-96df1682e579',
  shipperId: 'f92b3d47-f7da-4a12-b2db-35d902438f23',
  status: 'DRAFT',
  bids: [],
};

beforeEach(() => vi.clearAllMocks());

describe('shipment update service', () => {
  it('creates a draft shipment and converts the date and decimal fields', async () => {
    shipmentRepository.createShipment.mockResolvedValue({
      ...draft,
      status: 'PUBLISHED',
      loadSize: 'FULL_LOAD',
      pickupDate: new Date('2026-10-10T00:00:00.000Z'),
      weightKg: '125.50',
      pickupLat: '9.0100000',
      pickupLng: '38.7500000',
      deliveryLat: null,
      deliveryLng: null,
    });
    const input = {
      goodsDescription: 'Household furniture shipment',
      goodsType: 'Furniture',
      loadSize: 'FULL_LOAD',
      weightKg: 125.5,
      volumeM3: 15.5,
      pickupLocation: 'Addis Ababa',
      deliveryLocation: 'Hawassa',
      pickupDate: '2026-10-10',
    };

    const result = await shipmentService.createShipment(draft.shipperId, input);

    expect(shipmentRepository.createShipment).toHaveBeenCalledWith(draft.shipperId, {
      ...input,
      status: 'PUBLISHED',
      pickupDate: new Date('2026-10-10T00:00:00.000Z'),
    });
    expect(result).toMatchObject({ status: 'PUBLISHED', loadSize: 'FULL_LOAD', weightKg: 125.5, pickupLat: 9.01 });
  });

  it('lists a shipper’s own shipments with pagination metadata', async () => {
    shipmentRepository.findShipments.mockResolvedValue({ shipments: [{ ...draft, weightKg: '100.00' }], total: 21 });

    const result = await shipmentService.listShipments({ id: draft.shipperId, role: 'SHIPPER' }, { page: '2', limit: '10' });

    expect(shipmentRepository.findShipments).toHaveBeenCalledWith({
      includeImages: false,
      where: { shipperId: draft.shipperId, removedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 10,
      take: 10,
    });
    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 21, totalPages: 3 });
  });

  it('combines discovery filters and returns only published shipments to Transporters', async () => {
    shipmentRepository.findShipments.mockResolvedValue({ shipments: [], total: 0 });

    await shipmentService.listShipments(
      { id: 'transporter-id', role: 'TRANSPORTER' },
      {
        pickupLocation: 'addis',
        deliveryLocation: 'hawassa',
        goodsType: 'Furniture',
        pickupDateFrom: '2026-10-10',
        pickupDateTo: '2026-10-20',
        q: 'fragile',
        sortBy: 'pickupDate',
      },
    );

    expect(shipmentRepository.findShipments).toHaveBeenCalledWith({
      includeImages: true,
      where: {
        AND: [
          {
            status: 'PUBLISHED',
            removedAt: null,
            OR: [
              { specialRequirements: null },
              { NOT: { specialRequirements: { contains: '[INVITED_DRIVER:' } } },
              { specialRequirements: { contains: '[INVITED_DRIVER:transporter-id]' } },
            ],
          },
          { pickupLocation: { contains: 'addis', mode: 'insensitive' } },
          { deliveryLocation: { contains: 'hawassa', mode: 'insensitive' } },
          { goodsType: { equals: 'Furniture', mode: 'insensitive' } },
          {
            pickupDate: {
              gte: new Date('2026-10-10T00:00:00.000Z'),
              lte: new Date('2026-10-20T00:00:00.000Z'),
            },
          },
          {
            OR: [
              { goodsDescription: { contains: 'fragile', mode: 'insensitive' } },
              { specialRequirements: { contains: 'fragile', mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: [{ pickupDate: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 20,
    });
  });

  it('defaults Transporter discovery to newest published shipments', async () => {
    shipmentRepository.findShipments.mockResolvedValue({ shipments: [], total: 0 });

    await shipmentService.listShipments({ id: 'transporter-id', role: 'TRANSPORTER' }, {});

    expect(shipmentRepository.findShipments).toHaveBeenCalledWith({
      includeImages: true,
      where: {
        status: 'PUBLISHED',
        removedAt: null,
        OR: [
          { specialRequirements: null },
          { NOT: { specialRequirements: { contains: '[INVITED_DRIVER:' } } },
          { specialRequirements: { contains: '[INVITED_DRIVER:transporter-id]' } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 0,
      take: 20,
    });
  });

  it('filters to invited shipments only when requested by a transporter', async () => {
    shipmentRepository.findShipments.mockResolvedValue({ shipments: [], total: 0 });

    await shipmentService.listShipments({ id: 'transporter-id', role: 'TRANSPORTER' }, { invitedOnly: 'true' });

    expect(shipmentRepository.findShipments).toHaveBeenCalledWith({
      includeImages: true,
      where: {
        status: 'PUBLISHED',
        removedAt: null,
        specialRequirements: { contains: '[INVITED_DRIVER:transporter-id]' },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 0,
      take: 20,
    });
  });

  it('returns published shipment details to marketplace users', async () => {
    shipmentRepository.findShipmentById.mockResolvedValue({ ...draft, status: 'PUBLISHED', weightKg: '100.00', images: [] });

    const result = await shipmentService.getShipment({ id: 'transporter-id', role: 'TRANSPORTER' }, draft.id);

    expect(result.status).toBe('PUBLISHED');
    expect(result.weightKg).toBe(100);
  });

  it('prevents marketplace users from viewing another shipper’s draft', async () => {
    shipmentRepository.findShipmentById.mockResolvedValue({ ...draft, weightKg: '100.00', images: [] });

    await expect(shipmentService.getShipment({ id: 'transporter-id', role: 'TRANSPORTER' }, draft.id)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('prevents non-invited transporters from viewing a direct invite shipment', async () => {
    shipmentRepository.findShipmentById.mockResolvedValue({
      ...draft,
      status: 'PUBLISHED',
      weightKg: '100.00',
      specialRequirements: '[INVITED_DRIVER:invited-driver-1] Handle with care',
      images: [],
    });

    await expect(
      shipmentService.getShipment({ id: 'other-transporter', role: 'TRANSPORTER' }, draft.id),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows the invited transporter to view a direct invite shipment', async () => {
    shipmentRepository.findShipmentById.mockResolvedValue({
      ...draft,
      status: 'PUBLISHED',
      weightKg: '100.00',
      specialRequirements: '[INVITED_DRIVER:invited-driver-1] Handle with care',
      images: [],
    });

    const result = await shipmentService.getShipment(
      { id: 'invited-driver-1', role: 'TRANSPORTER' },
      draft.id,
    );

    expect(result.status).toBe('PUBLISHED');
    expect(result.specialRequirements).toBe('Handle with care');
    expect(result.invitedDriverId).toBe('invited-driver-1');
    expect(result.isDirectInvite).toBe(true);
  });

  it('updates a draft owned by the requesting shipper', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue(draft);
    shipmentRepository.updateShipment.mockResolvedValue({
      ...draft,
      goodsDescription: 'Household furniture shipment',
      weightKg: '125.50',
      pickupLat: null,
      pickupLng: null,
      deliveryLat: null,
      deliveryLng: null,
    });

    const result = await shipmentService.updateShipment(
      { id: draft.shipperId, role: 'SHIPPER' },
      draft.id,
      { goodsDescription: 'Household furniture shipment' },
    );

    expect(shipmentRepository.updateShipment).toHaveBeenCalledWith(draft.id, {
      goodsDescription: 'Household furniture shipment',
    });
    expect(result.weightKg).toBe(125.5);
  });

  it('rejects updates from a non-owner', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue(draft);

    await expect(
      shipmentService.updateShipment({ id: 'another-user', role: 'SHIPPER' }, draft.id, { goodsType: 'Furniture' }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(shipmentRepository.updateShipment).not.toHaveBeenCalled();
  });

  it('allows published shipment updates when no bid is accepted', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue({ ...draft, status: 'PUBLISHED' });
    shipmentRepository.updateShipment.mockResolvedValue({
      ...draft,
      status: 'PUBLISHED',
      pickupDate: new Date('2026-10-10T00:00:00.000Z'),
      weightKg: '125.50',
      pickupLat: null,
      pickupLng: null,
      deliveryLat: null,
      deliveryLng: null,
    });

    await shipmentService.updateShipment({ id: draft.shipperId }, draft.id, { pickupDate: '2026-10-10' });

    expect(shipmentRepository.updateShipment).toHaveBeenCalledWith(draft.id, {
      pickupDate: new Date('2026-10-10T00:00:00.000Z'),
    });
  });

  it('rejects updates when an accepted bid exists', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue({
      ...draft,
      status: 'PUBLISHED',
      bids: [{ id: 'accepted-bid' }],
    });

    await expect(
      shipmentService.updateShipment({ id: draft.shipperId }, draft.id, { goodsType: 'Furniture' }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(shipmentRepository.updateShipment).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown shipment', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue(null);

    await expect(
      shipmentService.updateShipment({ id: draft.shipperId }, draft.id, { goodsType: 'Furniture' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('publishes a draft owned by the shipper', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue(draft);
    shipmentRepository.transitionShipment.mockResolvedValue({ count: 1 });
    shipmentRepository.findShipmentAfterTransition.mockResolvedValue({ ...draft, status: 'PUBLISHED' });

    const result = await shipmentService.publishShipment({ id: draft.shipperId }, draft.id);

    expect(shipmentRepository.transitionShipment).toHaveBeenCalledWith(draft.id, ['DRAFT'], 'PUBLISHED');
    expect(result.status).toBe('PUBLISHED');
  });

  it('rejects publishing a shipment outside DRAFT', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue({ ...draft, status: 'PUBLISHED' });

    await expect(shipmentService.publishShipment({ id: draft.shipperId }, draft.id)).rejects.toMatchObject({ statusCode: 422 });
    expect(shipmentRepository.transitionShipment).not.toHaveBeenCalled();
  });

  it('rejects status actions from a non-owner', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue(draft);

    await expect(shipmentService.publishShipment({ id: 'another-user' }, draft.id)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('cancels an in-progress shipment and declines pending bids', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue({ ...draft, status: 'IN_PROGRESS' });
    shipmentRepository.cancelShipmentAndDeclinePendingBids.mockResolvedValue({ cancelled: true });
    shipmentRepository.findShipmentAfterTransition.mockResolvedValue({ ...draft, status: 'CANCELLED' });

    const result = await shipmentService.cancelShipment({ id: draft.shipperId }, draft.id);

    expect(shipmentRepository.cancelShipmentAndDeclinePendingBids).toHaveBeenCalledWith(draft.id);
    expect(result.status).toBe('CANCELLED');
  });

  it('allows cancellation of any non-completed shipment', async () => {
    for (const status of ['DRAFT', 'PUBLISHED']) {
      shipmentRepository.findShipmentStatusById.mockResolvedValueOnce({ ...draft, status });
      shipmentRepository.cancelShipmentAndDeclinePendingBids.mockResolvedValueOnce({ cancelled: true });
      shipmentRepository.findShipmentAfterTransition.mockResolvedValueOnce({ ...draft, status: 'CANCELLED' });
      await expect(shipmentService.cancelShipment({ id: draft.shipperId }, draft.id)).resolves.toMatchObject({ status: 'CANCELLED' });
    }
  });

  it('rejects cancelling completed shipments', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue({ ...draft, status: 'COMPLETED' });

    await expect(shipmentService.cancelShipment({ id: draft.shipperId }, draft.id)).rejects.toMatchObject({ statusCode: 422 });
    expect(shipmentRepository.cancelShipmentAndDeclinePendingBids).not.toHaveBeenCalled();
  });

  it('completes only an in-progress shipment', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue({ ...draft, status: 'IN_PROGRESS' });
    shipmentRepository.transitionShipment.mockResolvedValue({ count: 1 });
    shipmentRepository.findShipmentAfterTransition.mockResolvedValue({ ...draft, status: 'COMPLETED' });

    await expect(shipmentService.completeShipment({ id: draft.shipperId }, draft.id)).resolves.toMatchObject({ status: 'COMPLETED' });
    expect(shipmentRepository.transitionShipment).toHaveBeenCalledWith(draft.id, ['IN_PROGRESS'], 'COMPLETED');
  });

  it('rejects completion before the shipment is in progress', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue(draft);

    await expect(shipmentService.completeShipment({ id: draft.shipperId }, draft.id)).rejects.toMatchObject({ statusCode: 422 });
    expect(shipmentRepository.transitionShipment).not.toHaveBeenCalled();
  });

  it('uploads images for an owned shipment and persists their URLs', async () => {
    const files = [{ buffer: Buffer.from('first') }];
    shipmentRepository.findShipmentStatusById.mockResolvedValue(draft);
    shipmentRepository.countShipmentImages.mockResolvedValue(0);
    shipmentStorage.uploadShipmentImage
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/image/upload/first.png', publicId: 'first' });
    shipmentRepository.createShipmentImages.mockResolvedValue([
      { id: 'image-1', shipmentId: draft.id, url: 'https://res.cloudinary.com/demo/image/upload/first.png', order: 1 },
    ]);

    await expect(shipmentService.uploadShipmentImages({ id: draft.shipperId }, draft.id, files)).resolves.toHaveLength(1);
    expect(shipmentRepository.createShipmentImages).toHaveBeenCalledWith(draft.id, [
      { url: 'https://res.cloudinary.com/demo/image/upload/first.png', publicId: 'first' },
    ]);
  });

  it('enforces the single-image limit before contacting Cloudinary', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue(draft);
    shipmentRepository.countShipmentImages.mockResolvedValue(1);

    await expect(
      shipmentService.uploadShipmentImages({ id: draft.shipperId }, draft.id, [{ buffer: Buffer.from('image') }]),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(shipmentStorage.uploadShipmentImage).not.toHaveBeenCalled();
  });

  it('cleans up uploaded Cloudinary assets if persisting image records fails', async () => {
    const uploaded = { url: 'https://res.cloudinary.com/demo/image/upload/first.png', publicId: 'first' };
    shipmentRepository.findShipmentStatusById.mockResolvedValue(draft);
    shipmentRepository.countShipmentImages.mockResolvedValue(0);
    shipmentStorage.uploadShipmentImage.mockResolvedValue(uploaded);
    shipmentRepository.createShipmentImages.mockRejectedValue(new Error('database unavailable'));

    await expect(shipmentService.uploadShipmentImages({ id: draft.shipperId }, draft.id, [{ buffer: Buffer.from('image') }])).rejects.toThrow(
      'database unavailable',
    );
    expect(shipmentStorage.deleteUploadedImages).toHaveBeenCalledWith([uploaded]);
  });

  it('removes an owned shipment image from storage and database', async () => {
    const image = { id: 'image-1', url: 'https://res.cloudinary.com/demo/image/upload/v1/freight/file.png' };
    shipmentRepository.findShipmentStatusById.mockResolvedValue(draft);
    shipmentRepository.findShipmentImage.mockResolvedValue(image);
    shipmentStorage.deleteShipmentImage.mockResolvedValue(undefined);
    shipmentRepository.deleteShipmentImage.mockResolvedValue({ count: 1 });

    await expect(shipmentService.removeShipmentImage({ id: draft.shipperId }, draft.id, image.id)).resolves.toEqual({
      id: image.id,
      shipmentId: draft.id,
      deleted: true,
    });
    expect(shipmentStorage.deleteShipmentImage).toHaveBeenCalledWith(image.url);
    expect(shipmentRepository.deleteShipmentImage).toHaveBeenCalledWith(draft.id, image.id);
  });

  it('does not delete an image belonging to another shipment owner', async () => {
    shipmentRepository.findShipmentStatusById.mockResolvedValue(draft);

    await expect(shipmentService.removeShipmentImage({ id: 'other-user' }, draft.id, 'image-1')).rejects.toMatchObject({ statusCode: 403 });
    expect(shipmentStorage.deleteShipmentImage).not.toHaveBeenCalled();
  });
});
