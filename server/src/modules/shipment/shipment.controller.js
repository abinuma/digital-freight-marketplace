import { AppError } from '../../shared/utils/AppError.js';

export function notImplemented(req, res, next) {
  return next(new AppError('Shipment endpoint is not implemented yet', 501));
}
