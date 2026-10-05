import { logger } from '../utils/logger.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) logger.error({ err: error, path: req.originalUrl }, 'Request failed');
  const response = { error: { message: statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message } };
  if (error.details !== undefined) response.error.details = error.details;
  res.status(statusCode).json(response);
}
