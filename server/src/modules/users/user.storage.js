import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { URL } from 'node:url';
import { config } from '../../shared/config/index.js';
import { AppError } from '../../shared/utils/AppError.js';

function ensureCloudinaryConfigured() {
  if (!config.CLOUDINARY_URL) throw new AppError('Image storage is not configured', 503);
  cloudinary.config();
}

export function uploadProfilePhoto(buffer, userId) {
  ensureCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `freight/profiles/${userId}`, public_id: randomUUID(), resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteUploadedProfilePhoto(publicId) {
  if (!config.CLOUDINARY_URL) return;
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new AppError('Image storage could not remove the uploaded profile photo', 502);
  }
}

export async function deleteManagedProfilePhoto(url, userId) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  if (parsedUrl.hostname !== 'res.cloudinary.com' && !parsedUrl.hostname.endsWith('.res.cloudinary.com')) return false;
  const segments = parsedUrl.pathname.split('/').filter(Boolean);
  const uploadIndex = segments.indexOf('upload');
  if (uploadIndex < 1 || segments[uploadIndex - 1] !== 'image') return false;
  const afterUpload = segments.slice(uploadIndex + 1);
  const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdSegments = afterUpload.slice(versionIndex >= 0 ? versionIndex + 1 : 0);
  if (publicIdSegments.length < 4) return false;
  const filename = publicIdSegments.pop();
  publicIdSegments.push(filename.replace(/\.[^/.]+$/, ''));
  if (publicIdSegments[0] !== 'freight' || publicIdSegments[1] !== 'profiles' || publicIdSegments[2] !== userId) return false;

  await deleteUploadedProfilePhoto(publicIdSegments.join('/'));
  return true;
}

export function uploadVehiclePhoto(buffer, userId) {
  ensureCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `freight/vehicles/${userId}`, public_id: randomUUID(), resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteManagedVehiclePhoto(url, userId) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  if (parsedUrl.hostname !== 'res.cloudinary.com' && !parsedUrl.hostname.endsWith('.res.cloudinary.com')) return false;
  const segments = parsedUrl.pathname.split('/').filter(Boolean);
  const uploadIndex = segments.indexOf('upload');
  if (uploadIndex < 1 || segments[uploadIndex - 1] !== 'image') return false;
  const afterUpload = segments.slice(uploadIndex + 1);
  const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdSegments = afterUpload.slice(versionIndex >= 0 ? versionIndex + 1 : 0);
  if (publicIdSegments.length < 4) return false;
  const filename = publicIdSegments.pop();
  publicIdSegments.push(filename.replace(/\.[^/.]+$/, ''));
  if (publicIdSegments[0] !== 'freight' || publicIdSegments[1] !== 'vehicles' || publicIdSegments[2] !== userId) return false;

  await deleteUploadedProfilePhoto(publicIdSegments.join('/'));
  return true;
}

