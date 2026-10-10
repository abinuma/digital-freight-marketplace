import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { config } from './shared/config/index.js';
import { auth } from './shared/auth/index.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { generalRateLimiter } from './shared/middleware/rateLimiter.js';
import { notFound } from './shared/middleware/notFound.js';
import { logger } from './shared/utils/logger.js';
import apiRouter from './index.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use((req, res, next) => {
  res.on('finish', () => logger.info({ method: req.method, path: req.path, statusCode: res.statusCode }, 'HTTP request'));
  next();
});
app.use('/api', generalRateLimiter);

// Better Auth must receive the request before Express body parsers consume it.
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0', uptime: Math.floor(process.uptime()) });
});

app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorHandler);
