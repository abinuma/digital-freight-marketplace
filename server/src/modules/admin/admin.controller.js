import * as adminService from './admin.service.js';

export async function listShipments(req, res, next) {
  try {
    const { shipments, pagination } = await adminService.listShipments(req.user, req.query);
    return res.json({ data: shipments, meta: { pagination } });
  } catch (error) {
    return next(error);
  }
}

export async function removeShipment(req, res, next) {
  try {
    const result = await adminService.removeShipment(req.user, req.params.id);
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
}
