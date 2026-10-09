import { prisma } from '../../shared/db/prisma.js';

const shipmentReviewSelect = {
  id: true,
  shipmentId: true,
  reviewerId: true,
  revieweeId: true,
  rating: true,
  comment: true,
  createdAt: true,
  reviewer: { select: { id: true, name: true, image: true } },
  reviewee: { select: { id: true, name: true } },
};

export function findShipmentReviewContext(shipmentId) {
  return prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: {
      id: true,
      shipperId: true,
      status: true,
      removedAt: true,
      bids: {
        where: { status: 'ACCEPTED' },
        select: { transporterId: true },
        take: 1,
      },
    },
  });
}

export function createShipmentReview(data) {
  return prisma.review.create({ data, select: shipmentReviewSelect });
}

export async function findReviewsForShipment(shipmentId, { skip, take }) {
  const where = { shipmentId };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      select: shipmentReviewSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews.map(({ reviewer, ...review }) => {
      const { image, ...reviewerProfile } = reviewer;
      return { ...review, reviewer: { ...reviewerProfile, profilePhoto: image } };
    }),
    total,
  };
}

export function getReviewSummary(revieweeId) {
  return prisma.review.aggregate({
    where: { revieweeId },
    _avg: { rating: true },
    _count: { _all: true },
  });
}

export async function findReviewsForUser(revieweeId, { skip, take }) {
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { id: true, name: true, image: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
    prisma.review.count({ where: { revieweeId } }),
  ]);

  return {
    reviews: reviews.map(({ reviewer, ...review }) => {
      const { image, ...reviewerProfile } = reviewer;
      return { ...review, reviewer: { ...reviewerProfile, profilePhoto: image } };
    }),
    total,
  };
}
