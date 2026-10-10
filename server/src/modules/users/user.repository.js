import { prisma } from '../../shared/db/prisma.js';

const publicUserSelect = {
  id: true,
  name: true,
  phone: true,
  role: true,
  location: true,
  image: true,
  createdAt: true,
};

const vehicleSelect = {
  id: true,
  userId: true,
  type: true,
  capacityTons: true,
  plateNumber: true,
  createdAt: true,
  updatedAt: true,
};

export async function findPublicProfileById(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  if (!user) return null;

  const { image, ...profile } = user;
  return { ...profile, profilePhoto: image };
}

export function userExists(id) {
  return prisma.user.findUnique({ where: { id }, select: { id: true } });
}

export function updateUserProfile(id, input) {
  const { profilePhoto, ...profileFields } = input;
  const data = { ...profileFields };
  if (profilePhoto !== undefined) data.image = profilePhoto;

  return prisma.user.update({ where: { id }, data, select: publicUserSelect });
}

export function findProfilePhotoByUserId(id) {
  return prisma.user.findUnique({ where: { id }, select: { image: true } });
}

export async function findVehicleByUserId(userId) {
  const vehicle = await prisma.vehicle.findUnique({ where: { userId }, select: vehicleSelect });
  return vehicle ? { ...vehicle, capacityTons: Number(vehicle.capacityTons) } : null;
}

export async function upsertVehicle(userId, input) {
  const vehicle = await prisma.vehicle.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
    select: vehicleSelect,
  });

  return { ...vehicle, capacityTons: Number(vehicle.capacityTons) };
}
