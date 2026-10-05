-- Keep one active bid per transporter per shipment while allowing historical bids.
CREATE UNIQUE INDEX "idx_bid_shipment_transporter"
ON "Bid"("shipmentId", "transporterId")
WHERE "status" = 'PENDING';

-- Restrict review ratings to the documented five-star range.
ALTER TABLE "Review"
ADD CONSTRAINT "Review_rating_check"
CHECK ("rating" >= 1 AND "rating" <= 5);
