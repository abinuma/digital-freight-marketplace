import { prisma } from '../../shared/db/prisma.js';

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
