import { logger } from '../utils/logger.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) logger.error({ err: error, path: req.path }, 'Request failed');
  const isProduction = process.env.NODE_ENV === 'production';
  const response = { error: { message: statusCode >= 500 && isProduction ? 'Internal server error' : error.message } };
  if (statusCode < 500 && error.details !== undefined) response.error.details = error.details;
  res.status(statusCode).json(response);
}
