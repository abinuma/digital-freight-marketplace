import * as reviewRepository from './review.repository.js';

export async function getReviewSummary(revieweeId) {
  const summary = await reviewRepository.getReviewSummary(revieweeId);
  return {
    averageRating: summary._avg.rating,
    reviewCount: summary._count._all,
  };
}

export function getReviewsForUser(revieweeId, pagination) {
  return reviewRepository.findReviewsForUser(revieweeId, pagination);
}
