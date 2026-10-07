import { Buffer } from 'node:buffer';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../../../src/shared/middleware/errorHandler.js';
import { parseShipmentImages } from '../../../src/modules/shipment/shipment.upload.js';

const validPng = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

function createApp() {
  const app = express();
  app.post('/upload', parseShipmentImages, (req, res) => res.json({ count: req.files.length }));
  app.use(errorHandler);
  return app;
}

describe('shipment image upload middleware', () => {
  it('accepts a supported image with a matching file signature', async () => {
    const response = await request(createApp()).post('/upload').attach('images', validPng, {
      filename: 'shipment.png',
      contentType: 'image/png',
    });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
  });

  it('rejects a file whose declared MIME type is unsupported', async () => {
    const response = await request(createApp()).post('/upload').attach('images', validPng, {
      filename: 'shipment.gif',
      contentType: 'image/gif',
    });

    expect(response.status).toBe(400);
  });

  it('rejects a supported MIME type when its content signature does not match', async () => {
    const response = await request(createApp()).post('/upload').attach('images', Buffer.from('not an image'), {
      filename: 'shipment.png',
      contentType: 'image/png',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/content does not match/i);
  });

  it('rejects files larger than 5 MB', async () => {
    const oversizedPng = Buffer.concat([validPng, Buffer.alloc(5 * 1024 * 1024)]);
    const response = await request(createApp()).post('/upload').attach('images', oversizedPng, {
      filename: 'large.png',
      contentType: 'image/png',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/5 MB/i);
  });

  it('rejects more than 5 files in one request', async () => {
    let upload = request(createApp()).post('/upload');
    for (let index = 0; index < 6; index += 1) {
      upload = upload.attach('images', validPng, { filename: `image-${index}.png`, contentType: 'image/png' });
    }
    const response = await upload;

    expect(response.status).toBe(400);
  });

  it('rejects requests without any images', async () => {
    const response = await request(createApp()).post('/upload').field('description', 'No image attached');

    expect(response.status).toBe(400);
  });
});
