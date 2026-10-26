import * as reviewService from "./review.service.js";

export async function createShipmentReview(req, res, next) {
  try {
    const review = await reviewService.createShipmentReview(
      req.user,
      req.params.shipmentId,
      req.body,
    );
    return res.status(201).json({ data: review });
  } catch (error) {
    return next(error);
  }
}

export async function listShipmentReviews(req, res, next) {
  try {
    const { reviews, pagination } = await reviewService.getShipmentReviews(
      req.params.shipmentId,
      req.query,
    );
    return res.json({ data: reviews, meta: { pagination } });
  } catch (error) {
    return next(error);
  }
}
