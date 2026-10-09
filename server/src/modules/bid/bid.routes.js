import { Router } from 'express';
import * as bidController from './bid.controller.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  bidIdParamsSchema,
  bidListQuerySchema,
  createBidSchema,
  declineBidSchema,
  myBidsQuerySchema,
  updateBidSchema,
} from './bid.validation.js';

const router = Router();

// Keep the static /bids/my route ahead of the nested parameterized routes.
router.get('/bids/my', authorize('TRANSPORTER'), validate(myBidsQuerySchema), bidController.listMyBids);
router.post('/shipments/:shipmentId/bids', authorize('TRANSPORTER'), validate(createBidSchema), bidController.createBid);
router.get('/shipments/:shipmentId/bids', validate(bidListQuerySchema), bidController.listShipmentBids);
router.get('/shipments/:shipmentId/bids/:id', validate(bidIdParamsSchema), bidController.getBid);
router.patch('/shipments/:shipmentId/bids/:id', authorize('TRANSPORTER'), validate(updateBidSchema), bidController.updateBid);
router.patch(
  '/shipments/:shipmentId/bids/:id/withdraw',
  authorize('TRANSPORTER'),
  validate(bidIdParamsSchema),
  bidController.withdrawBid,
);
router.patch(
  '/shipments/:shipmentId/bids/:id/accept',
  authorize('SHIPPER'),
  validate(bidIdParamsSchema),
  bidController.acceptBid,
);
router.patch(
  '/shipments/:shipmentId/bids/:id/decline',
  authorize('SHIPPER'),
  validate(declineBidSchema),
  bidController.declineBid,
);

export default router;
