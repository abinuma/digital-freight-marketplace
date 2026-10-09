import * as bidService from './bid.service.js';

export async function createBid(req, res, next) {
  try {
    const bid = await bidService.createBid(req.user, req.params.shipmentId, req.body);
    return res.status(201).json({ data: bid });
  } catch (error) {
    return next(error);
  }
}

export async function listShipmentBids(req, res, next) {
  try {
    const { bids, pagination } = await bidService.listShipmentBids(req.user, req.params.shipmentId, req.query);
    return res.json({ data: bids, meta: { pagination } });
  } catch (error) {
    return next(error);
  }
}

export async function listMyBids(req, res, next) {
  try {
    const { bids, pagination } = await bidService.listMyBids(req.user, req.query);
    return res.json({ data: bids, meta: { pagination } });
  } catch (error) {
    return next(error);
  }
}

export async function getBid(req, res, next) {
  try {
    const bid = await bidService.getBid(req.user, req.params.shipmentId, req.params.id);
    return res.json({ data: bid });
  } catch (error) {
    return next(error);
  }
}

export async function updateBid(req, res, next) {
  try {
    const bid = await bidService.updateBid(req.user, req.params.shipmentId, req.params.id, req.body);
    return res.json({ data: bid });
  } catch (error) {
    return next(error);
  }
}

export async function withdrawBid(req, res, next) {
  try {
    const bid = await bidService.withdrawBid(req.user, req.params.shipmentId, req.params.id);
    return res.json({ data: bid });
  } catch (error) {
    return next(error);
  }
}
