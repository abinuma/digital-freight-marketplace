import { v2 as cloudinary } from 'cloudinary';
import { URL } from 'node:url';
import { config } from '../../shared/config/index.js';
import { AppError } from '../../shared/utils/AppError.js';

function ensureCloudinaryConfigured() {
  if (!config.CLOUDINARY_URL) throw new AppError('Image storage is not configured', 503);
  cloudinary.config();
}

export function uploadShipmentImage(buffer, shipmentId) {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `freight/shipments/${shipmentId}`, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

function publicIdFromUrl(url) {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  const uploadIndex = segments.indexOf('upload');
  if (uploadIndex < 0) throw new AppError('Stored image URL is invalid', 500);
  const afterUpload = segments.slice(uploadIndex + 1);
  const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdSegments = afterUpload.slice(versionIndex >= 0 ? versionIndex + 1 : 0);
  if (publicIdSegments.length === 0) throw new AppError('Stored image URL is invalid', 500);

  const filename = publicIdSegments.pop();
  publicIdSegments.push(filename.replace(/\.[^/.]+$/, ''));
  return publicIdSegments.join('/');
}

export async function deleteShipmentImage(url) {
  ensureCloudinaryConfigured();
  const result = await cloudinary.uploader.destroy(publicIdFromUrl(url), { resource_type: 'image' });
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new AppError('Image storage could not remove the image', 502);
  }
}

export async function deleteUploadedImages(images) {
  await Promise.allSettled(images.map(({ publicId }) => cloudinary.uploader.destroy(publicId, { resource_type: 'image' })));
}
