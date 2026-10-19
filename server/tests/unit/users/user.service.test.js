import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/users/user.repository.js', () => ({
  findPublicProfileById: vi.fn(),
  updateUserProfile: vi.fn(),
  findVehicleByUserId: vi.fn(),
  upsertVehicle: vi.fn(),
  updateVehiclePhoto: vi.fn(),
  userExists: vi.fn(),
}));

vi.mock('../../../src/modules/users/user.storage.js', () => ({
  uploadProfilePhoto: vi.fn(),
  deleteUploadedProfilePhoto: vi.fn(),
  deleteManagedProfilePhoto: vi.fn(),
  uploadVehiclePhoto: vi.fn(),
  deleteManagedVehiclePhoto: vi.fn(),
}));

vi.mock('../../../src/modules/shipment/review.service.js', () => ({
  getReviewSummary: vi.fn(),
  getReviewsForUser: vi.fn(),
}));

import * as reviewService from '../../../src/modules/shipment/review.service.js';
import * as userRepository from '../../../src/modules/users/user.repository.js';
import * as userStorage from '../../../src/modules/users/user.storage.js';
import * as userService from '../../../src/modules/users/user.service.js';
import { AppError } from '../../../src/shared/utils/AppError.js';
import { paginationQuerySchema, updateProfileSchema, upsertVehicleSchema } from '../../../src/modules/users/user.validation.js';

const profile = {
  id: '0ecb5efc-f011-4fc9-92a8-96df1682e579',
  name: 'Amina Hassan',
  phone: '+251911234567',
  role: 'TRANSPORTER',
  location: 'Addis Ababa',
  profilePhoto: null,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('user profile service', () => {
  it('returns a public profile with review summary', async () => {
    userRepository.findPublicProfileById.mockResolvedValue(profile);
    reviewService.getReviewSummary.mockResolvedValue({ averageRating: 4.5, reviewCount: 2 });

    await expect(userService.getPublicProfile(profile.id)).resolves.toEqual({
      ...profile,
      averageRating: 4.5,
      reviewCount: 2,
    });
  });

  it('returns 404 when a profile does not exist', async () => {
    userRepository.findPublicProfileById.mockResolvedValue(null);

    await expect(userService.getPublicProfile(profile.id)).rejects.toMatchObject({ statusCode: 404 });
    expect(reviewService.getReviewSummary).not.toHaveBeenCalled();
  });

  it('updates the caller profile and maps the profile photo field', async () => {
    userRepository.updateUserProfile.mockResolvedValue({ ...profile, name: 'Amina H.', image: 'https://cdn.example.test/profile.webp' });

    await expect(userService.updateProfile(profile.id, profile.id, { name: 'Amina H.' })).resolves.toEqual({
      ...profile,
      name: 'Amina H.',
      profilePhoto: 'https://cdn.example.test/profile.webp',
    });
    expect(userRepository.updateUserProfile).toHaveBeenCalledWith(profile.id, { name: 'Amina H.' });
  });

  it('forbids updating another user profile', async () => {
    await expect(userService.updateProfile('another-user', profile.id, { name: 'Changed' })).rejects.toBeInstanceOf(AppError);
    await expect(userService.updateProfile('another-user', profile.id, { name: 'Changed' })).rejects.toMatchObject({ statusCode: 403 });
    expect(userRepository.updateUserProfile).not.toHaveBeenCalled();
  });
});

describe('vehicle service', () => {
  const vehicle = {
    id: '29f7bf8c-6f0d-4a99-9e02-5c5018f2f2c4',
    userId: profile.id,
    type: 'Flatbed truck',
    capacityTons: 12.5,
    plateNumber: 'AA-12345',
  };

  it('returns a transporter vehicle', async () => {
    userRepository.findVehicleByUserId.mockResolvedValue(vehicle);

    await expect(userService.getVehicle(profile.id)).resolves.toEqual(vehicle);
  });

  it('returns 404 when the user has no vehicle', async () => {
    userRepository.findVehicleByUserId.mockResolvedValue(null);

    await expect(userService.getVehicle(profile.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('allows the owning transporter to create or update a vehicle', async () => {
    userRepository.upsertVehicle.mockResolvedValue(vehicle);

    await expect(userService.updateVehicle({ id: profile.id, role: 'TRANSPORTER' }, profile.id, vehicle)).resolves.toEqual(vehicle);
    expect(userRepository.upsertVehicle).toHaveBeenCalledWith(profile.id, vehicle);
  });

  it('forbids a shipper from managing a vehicle', async () => {
    await expect(userService.updateVehicle({ id: profile.id, role: 'SHIPPER' }, profile.id, vehicle)).rejects.toMatchObject({ statusCode: 403 });
    expect(userRepository.upsertVehicle).not.toHaveBeenCalled();
  });

  it('forbids a transporter from updating another user vehicle', async () => {
    await expect(userService.updateVehicle({ id: 'another-user', role: 'TRANSPORTER' }, profile.id, vehicle)).rejects.toMatchObject({ statusCode: 403 });
    expect(userRepository.upsertVehicle).not.toHaveBeenCalled();
  });

  it('uploads a vehicle photo for an existing vehicle and updates the record', async () => {
    userRepository.findVehicleByUserId.mockResolvedValue(vehicle);
    userStorage.uploadVehiclePhoto.mockResolvedValue({ url: 'https://cdn.example.test/truck.webp', publicId: 'pid-1' });
    userRepository.updateVehiclePhoto.mockResolvedValue({ ...vehicle, photo: 'https://cdn.example.test/truck.webp' });

    const file = { buffer: Buffer.from('fake-image') };
    await expect(userService.uploadVehiclePhoto({ id: profile.id, role: 'TRANSPORTER' }, profile.id, file)).resolves.toEqual({
      ...vehicle,
      photo: 'https://cdn.example.test/truck.webp',
    });
    expect(userStorage.uploadVehiclePhoto).toHaveBeenCalledWith(file.buffer, profile.id);
    expect(userRepository.updateVehiclePhoto).toHaveBeenCalledWith(profile.id, 'https://cdn.example.test/truck.webp');
  });

  it('uploads a vehicle photo when no vehicle exists yet and returns the photo URL', async () => {
    userRepository.findVehicleByUserId.mockResolvedValue(null);
    userStorage.uploadVehiclePhoto.mockResolvedValue({ url: 'https://cdn.example.test/truck.webp', publicId: 'pid-2' });

    const file = { buffer: Buffer.from('fake-image') };
    await expect(userService.uploadVehiclePhoto({ id: profile.id, role: 'TRANSPORTER' }, profile.id, file)).resolves.toEqual({
      photo: 'https://cdn.example.test/truck.webp',
    });
  });
});

describe('review service integration through user service', () => {
  it('returns paginated reviews for an existing profile', async () => {
    userRepository.userExists.mockResolvedValue({ id: profile.id });
    reviewService.getReviewsForUser.mockResolvedValue({ reviews: [{ id: 'review-1', rating: 5 }], total: 21 });

    await expect(userService.getReviews(profile.id, { page: 2, limit: 10 })).resolves.toEqual({
      reviews: [{ id: 'review-1', rating: 5 }],
      pagination: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });
    expect(reviewService.getReviewsForUser).toHaveBeenCalledWith(profile.id, { skip: 10, take: 10 });
  });

  it('returns 404 when reviews are requested for an unknown user', async () => {
    userRepository.userExists.mockResolvedValue(null);

    await expect(userService.getReviews(profile.id, {})).rejects.toMatchObject({ statusCode: 404 });
    expect(reviewService.getReviewsForUser).not.toHaveBeenCalled();
  });
});

describe('user endpoint validation', () => {
  it('accepts nullable profile fields but rejects an empty update', () => {
    expect(updateProfileSchema.body.safeParse({ location: null, profilePhoto: null }).success).toBe(true);
    expect(updateProfileSchema.body.safeParse({}).success).toBe(false);
  });

  it('validates review pagination bounds', () => {
    expect(paginationQuerySchema.query.safeParse({ page: '2', limit: '50' }).success).toBe(true);
    expect(paginationQuerySchema.query.safeParse({ page: '0', limit: '101' }).success).toBe(false);
  });

  it('requires valid vehicle capacity and required fields', () => {
    const base = { params: { id: profile.id }, body: { type: 'Truck', capacityTons: 12.5, plateNumber: 'AA-12345' } };
    expect(upsertVehicleSchema.params.safeParse(base.params).success).toBe(true);
    expect(upsertVehicleSchema.body.safeParse(base.body).success).toBe(true);
    expect(upsertVehicleSchema.body.safeParse({ ...base.body, capacityTons: 0 }).success).toBe(false);
  });

  it('validates vehicle payload with optional photo URL', () => {
    const payload = {
      type: 'Truck',
      capacityTons: 10,
      plateNumber: 'AA-12345',
      photo: 'https://cdn.example.test/truck.webp',
    };
    expect(upsertVehicleSchema.body.safeParse(payload).success).toBe(true);
    expect(upsertVehicleSchema.body.safeParse({ ...payload, photo: 'invalid-url' }).success).toBe(false);
  });
});
