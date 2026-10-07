import * as shipmentService from './shipment.service.js';

export async function createShipment(req, res, next) {
  try {
    const shipment = await shipmentService.createShipment(req.user.id, req.body);
    return res.status(201).json({ data: shipment });
  } catch (error) {
    return next(error);
  }
}

export async function listShipments(req, res, next) {
  try {
    const { shipments, pagination } = await shipmentService.listShipments(req.user, req.query);
    return res.json({ data: shipments, meta: { pagination } });
  } catch (error) {
    return next(error);
  }
}

export async function getShipment(req, res, next) {
  try {
    const shipment = await shipmentService.getShipment(req.user, req.params.id);
    return res.json({ data: shipment });
  } catch (error) {
    return next(error);
  }
}

export async function updateShipment(req, res, next) {
  try {
    const shipment = await shipmentService.updateShipment(req.user, req.params.id, req.body);
    return res.json({ data: shipment });
  } catch (error) {
    return next(error);
  }
}

export async function publishShipment(req, res, next) {
  try {
    const shipment = await shipmentService.publishShipment(req.user, req.params.id);
    return res.json({ data: shipment });
  } catch (error) {
    return next(error);
  }
}

export async function cancelShipment(req, res, next) {
  try {
    const shipment = await shipmentService.cancelShipment(req.user, req.params.id);
    return res.json({ data: shipment });
  } catch (error) {
    return next(error);
  }
}

export async function completeShipment(req, res, next) {
  try {
    const shipment = await shipmentService.completeShipment(req.user, req.params.id);
    return res.json({ data: shipment });
  } catch (error) {
    return next(error);
  }
}
