import multer from 'multer';
import { Buffer } from 'node:buffer';
import { AppError } from '../../shared/utils/AppError.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxFileSize = 5 * 1024 * 1024;

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
    }
    return callback(null, true);
  },
}).array('images', 1);

function hasValidSignature(file) {
  const { buffer, mimetype } = file;
  if (mimetype === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimetype === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

export function parseShipmentImages(req, res, next) {
  parser(req, res, (error) => {
    if (error) {
      if (error instanceof AppError) return next(error);
      if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
          ? 'Each image must be 5 MB or smaller'
          : 'Only one cargo photo may be uploaded per shipment';
        return next(new AppError(message, 400));
      }
      return next(error);
    }

    if (!req.files?.length) return next(new AppError('Select at least one image to upload', 400));
    if (req.files.some((file) => !hasValidSignature(file))) {
      return next(new AppError('Image content does not match its declared file type', 400));
    }
    return next();
  });
}
