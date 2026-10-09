import * as adminService from './admin.service.js';

export async function listUsers(req, res, next) {
  try {
    const { users, pagination } = await adminService.listUsers(req.query);
    return res.json({ data: users, meta: { pagination } });
  } catch (error) {
    return next(error);
  }
}

export async function suspendUser(req, res, next) {
  try {
    const user = await adminService.suspendUser(req.params.id, req.body.reason);
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
}

export async function activateUser(req, res, next) {
  try {
    const user = await adminService.activateUser(req.params.id);
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
}

export async function getMetrics(req, res, next) {
  try {
    const metrics = await adminService.getMetrics();
    return res.json({ data: metrics });
  } catch (error) {
    return next(error);
  }
}

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
    const result = await adminService.removeShipment(req.user, req.params.id, req.body.reason);
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
}
