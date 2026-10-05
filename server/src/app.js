import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './shared/config/index.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { generalRateLimiter } from './shared/middleware/rateLimiter.js';
import { notFound } from './shared/middleware/notFound.js';
import { logger } from './shared/utils/logger.js';
import apiRouter from './index.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => {
  res.on('finish', () => logger.info({ method: req.method, path: req.originalUrl, statusCode: res.statusCode }, 'HTTP request'));
  next();
});
app.use('/api', generalRateLimiter);

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0', uptime: Math.floor(process.uptime()) });
});

app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorHandler);
