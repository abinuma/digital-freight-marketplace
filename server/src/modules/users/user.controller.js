import * as userService from './user.service.js';

export async function getProfile(req, res, next) {
  try {
    return res.json({ data: await userService.getPublicProfile(req.params.id) });
  } catch (error) {
    return next(error);
  }
}

export async function listAvailableTransporters(req, res, next) {
  try {
    const transporters = await userService.listAvailableTransporters(req.user, req.query.city);
    return res.json({ data: transporters });
  } catch (error) { return next(error); }
}

export async function setLoadAvailability(req, res, next) {
  try {
    const availability = await userService.setLoadAvailability(req.user, req.params.id, req.body.lookingForLoads);
    return res.json({ data: availability });
  } catch (error) { return next(error); }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user.id, req.params.id, req.body);
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
}

export async function uploadProfilePhoto(req, res, next) {
  try {
    const user = await userService.uploadProfilePhoto(req.user.id, req.params.id, req.file);
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
}

export async function getVehicle(req, res, next) {
  try {
    return res.json({ data: await userService.getVehicle(req.params.id) });
  } catch (error) {
    return next(error);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const vehicle = await userService.updateVehicle(req.user, req.params.id, req.body);
    return res.json({ data: vehicle });
  } catch (error) {
    return next(error);
  }
}

export async function getReviews(req, res, next) {
  try {
    const { reviews, pagination } = await userService.getReviews(req.params.id, req.query);
    return res.json({ data: reviews, meta: { pagination } });
  } catch (error) {
    return next(error);
  }
}
