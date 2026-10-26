import * as reviewRepository from "./review.repository.js";
import { AppError } from "../../shared/utils/AppError.js";
import {
  formatPagination,
  getPagination,
} from "../../shared/utils/pagination.js";

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

function isDuplicateReview(error) {
  return (
    error?.code === "P2002" &&
    (error?.meta?.target?.includes?.("shipmentId_reviewerId") ||
      (Array.isArray(error?.meta?.target) &&
        error.meta.target.includes("shipmentId") &&
        error.meta.target.includes("reviewerId")))
  );
}

function toApiReview(review) {
  const { image, ...reviewer } = review.reviewer;
  return { ...review, reviewer: { ...reviewer, profilePhoto: image } };
}

export async function createShipmentReview(user, shipmentId, input) {
  const shipment = await reviewRepository.findShipmentReviewContext(shipmentId);
  if (!shipment || shipment.removedAt)
    throw new AppError("Shipment was not found", 404);
  if (shipment.status !== "COMPLETED") {
    throw new AppError(
      "Reviews can only be submitted after shipment completion",
      422,
    );
  }

  const transporterId = shipment.bids[0]?.transporterId;
  let revieweeId;
  if (user.role === "SHIPPER" && user.id === shipment.shipperId) {
    if (!transporterId)
      throw new AppError(
        "The completed shipment has no accepted transporter to review",
        409,
      );
    revieweeId = transporterId;
  } else if (user.role === "TRANSPORTER" && user.id === transporterId) {
    revieweeId = shipment.shipperId;
  } else {
    throw new AppError("Only shipment participants can submit a review", 403);
  }

  try {
    const review = await reviewRepository.createShipmentReview({
      shipmentId,
      reviewerId: user.id,
      revieweeId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    });
    return toApiReview(review);
  } catch (error) {
    if (isDuplicateReview(error))
      throw new AppError("You have already reviewed this shipment", 409);
    throw error;
  }
}

export async function getShipmentReviews(shipmentId, query = {}) {
  const shipment = await reviewRepository.findShipmentReviewContext(shipmentId);
  if (!shipment || shipment.removedAt) {
    throw new AppError("Shipment was not found", 404);
  }

  const { page, limit, skip, take } = getPagination(query);
  const { reviews, total } = await reviewRepository.findReviewsForShipment(
    shipmentId,
    { skip, take },
  );
  return { reviews, pagination: formatPagination({ page, limit, total }) };
}
