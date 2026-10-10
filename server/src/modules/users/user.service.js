import { AppError } from '../../shared/utils/AppError.js';
import { formatPagination, getPagination } from '../../shared/utils/pagination.js';
import * as reviewService from '../shipment/review.service.js';
import * as userRepository from './user.repository.js';
import * as userStorage from './user.storage.js';

function ensureOwner(actorId, targetId) {
  if (actorId !== targetId) throw new AppError('You can only update your own profile', 403);
}

function isMissingRecord(error) {
  return error?.code === 'P2025';
}

export async function getPublicProfile(id) {
  const profile = await userRepository.findPublicProfileById(id);
  if (!profile) throw new AppError('User profile was not found', 404);
  const rating = await reviewService.getReviewSummary(id);
  return { ...profile, ...rating };
}

export async function updateProfile(actorId, targetId, input) {
  ensureOwner(actorId, targetId);
  try {
    const user = await userRepository.updateUserProfile(targetId, input);
    const { image, ...profile } = user;
    return { ...profile, profilePhoto: image };
  } catch (error) {
    if (isMissingRecord(error)) throw new AppError('User profile was not found', 404);
    throw error;
  }
}

export async function uploadProfilePhoto(actorId, targetId, file) {
  ensureOwner(actorId, targetId);
  const existingProfile = await userRepository.findProfilePhotoByUserId(targetId);
  if (!existingProfile) throw new AppError('User profile was not found', 404);

  const uploaded = await userStorage.uploadProfilePhoto(file.buffer, targetId);
  try {
    const user = await userRepository.updateUserProfile(targetId, { profilePhoto: uploaded.url });
    const { image, ...profile } = user;
    if (existingProfile.image && existingProfile.image !== image) {
      const currentProfile = await userRepository.findProfilePhotoByUserId(targetId);
      if (currentProfile?.image === image) {
        await userStorage.deleteManagedProfilePhoto(existingProfile.image, targetId).catch(() => undefined);
      }
    }
    return { ...profile, profilePhoto: image };
  } catch (error) {
    await userStorage.deleteUploadedProfilePhoto(uploaded.publicId).catch(() => undefined);
    if (isMissingRecord(error)) throw new AppError('User profile was not found', 404);
    throw error;
  }
}

export async function getVehicle(id) {
  const vehicle = await userRepository.findVehicleByUserId(id);
  if (!vehicle) throw new AppError('Vehicle was not found', 404);
  return vehicle;
}

export async function updateVehicle(actor, targetId, input) {
  ensureOwner(actor.id, targetId);
  if (actor.role !== 'TRANSPORTER') throw new AppError('Only Transporters can manage vehicle details', 403);

  try {
    return await userRepository.upsertVehicle(targetId, input);
  } catch (error) {
    if (isMissingRecord(error)) throw new AppError('User profile was not found', 404);
    throw error;
  }
}

export async function getReviews(id, query) {
  if (!(await userRepository.userExists(id))) throw new AppError('User profile was not found', 404);

  const { page, limit, skip, take } = getPagination(query);
  const { reviews, total } = await reviewService.getReviewsForUser(id, { skip, take });

  return { reviews, pagination: formatPagination({ page, limit, total }) };
}
