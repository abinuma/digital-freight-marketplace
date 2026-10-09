import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/shipment/review.repository.js', () => ({
  findShipmentReviewContext: vi.fn(),
  createShipmentReview: vi.fn(),
  findReviewsForShipment: vi.fn(),
  getReviewSummary: vi.fn(),
  findReviewsForUser: vi.fn(),
}));

import * as reviewRepository from '../../../src/modules/shipment/review.repository.js';
import * as reviewService from '../../../src/modules/shipment/review.service.js';

const shipper = { id: 'shipper-id', role: 'SHIPPER' };
const shipmentId = 'shipment-id';

beforeEach(() => vi.clearAllMocks());

describe('shipment review service', () => {
  it('allows a participant to review after completion and trims the comment', async () => {
    reviewRepository.findShipmentReviewContext.mockResolvedValue({
      id: shipmentId,
      shipperId: shipper.id,
      status: 'COMPLETED',
      bids: [{ transporterId: 'transporter-id' }],
    });
    reviewRepository.createShipmentReview.mockResolvedValue({
      id: 'review-id',
      reviewer: { id: shipper.id, name: 'Shipper', image: null },
      rating: 5,
      comment: 'Good service',
    });

    const review = await reviewService.createShipmentReview(shipper, shipmentId, { rating: 5, comment: '  Good service  ' });

    expect(reviewRepository.createShipmentReview).toHaveBeenCalledWith({
      shipmentId,
      reviewerId: shipper.id,
      revieweeId: 'transporter-id',
      rating: 5,
      comment: 'Good service',
    });
    expect(review.reviewer.profilePhoto).toBeNull();
  });

  it('rejects reviews from nonparticipants and for incomplete shipments', async () => {
    reviewRepository.findShipmentReviewContext.mockResolvedValueOnce({
      id: shipmentId,
      shipperId: shipper.id,
      status: 'PUBLISHED',
      bids: [{ transporterId: 'transporter-id' }],
    }).mockResolvedValueOnce({
      id: shipmentId,
      shipperId: shipper.id,
      status: 'COMPLETED',
      bids: [{ transporterId: 'transporter-id' }],
    });

    await expect(reviewService.createShipmentReview(shipper, shipmentId, { rating: 4 }))
      .rejects.toMatchObject({ statusCode: 422 });
    await expect(reviewService.createShipmentReview({ id: 'intruder', role: 'SHIPPER' }, shipmentId, { rating: 4 }))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(reviewRepository.createShipmentReview).not.toHaveBeenCalled();
  });

  it('maps duplicate-review constraints to conflict responses', async () => {
    reviewRepository.findShipmentReviewContext.mockResolvedValue({
      id: shipmentId,
      shipperId: shipper.id,
      status: 'COMPLETED',
      bids: [{ transporterId: 'transporter-id' }],
    });
    reviewRepository.createShipmentReview.mockRejectedValue({ code: 'P2002', meta: { target: ['shipmentId', 'reviewerId'] } });

    await expect(reviewService.createShipmentReview(shipper, shipmentId, { rating: 4 }))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});
