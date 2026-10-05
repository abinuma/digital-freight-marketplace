import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../../src/shared/middleware/errorHandler.js';
import { validate } from '../../src/shared/middleware/validate.js';
import { AppError } from '../../src/shared/utils/AppError.js';
import { z } from 'zod';

function createApp(middleware) {
  const app = express();
  app.use(express.json());
  app.post('/test', middleware, (req, res) => res.json({ accepted: req.body.count }));
  app.use(errorHandler);
  return app;
}

describe('shared middleware', () => {
  it('returns 400 with Zod issue details for invalid input', async () => {
    const response = await request(createApp(validate({ body: z.object({ count: z.number() }) }))).post('/test').send({ count: 'bad' });
    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
    expect(response.body.error.details[0].path).toEqual(['count']);
  });

  it('formats application errors', async () => {
    const app = express();
    app.get('/fail', (req, res, next) => next(new AppError('No access', 403)));
    app.use(errorHandler);
    const response = await request(app).get('/fail');
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: { message: 'No access' } });
  });

  it('returns 429 after the configured auth limit', async () => {
    const { authRateLimiter } = await import('../../src/shared/middleware/rateLimiter.js');
    const app = express();
    app.use(authRateLimiter);
    app.get('/limited', (req, res) => res.sendStatus(200));
    for (let i = 0; i < 10; i += 1) expect((await request(app).get('/limited')).status).toBe(200);
    expect((await request(app).get('/limited')).status).toBe(429);
  });
});
