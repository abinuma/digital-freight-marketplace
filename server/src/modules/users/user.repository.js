import { prisma } from '../../shared/db/prisma.js';

const publicUserSelect = {
  id: true,
  name: true,
  phone: true,
  role: true,
  location: true,
  region: true,
  zone: true,
  city: true,
  image: true,
  availableDays: true,
  preferredLoadTypes: true,
  createdAt: true,
  lookingForLoads: true,
  availabilityUpdatedAt: true,
};

const vehicleSelect = {
  id: true,
  userId: true,
  type: true,
  capacityTons: true,
  volumeM3: true,
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

export function setLoadAvailability(id, lookingForLoads) {
  return prisma.user.update({
    where: { id },
    data: { lookingForLoads, availabilityUpdatedAt: new Date() },
    select: { id: true, lookingForLoads: true, availabilityUpdatedAt: true },
  });
}

export async function findAvailableTransporters(city) {
  const users = await prisma.user.findMany({
    where: { role: 'TRANSPORTER', status: 'ACTIVE', lookingForLoads: true, city: { equals: city, mode: 'insensitive' } },
    select: {
      id: true, name: true, city: true, availabilityUpdatedAt: true, image: true, availableDays: true,
      vehicle: { select: { type: true, capacityTons: true, volumeM3: true } },
      journeyPlans: {
        where: { status: 'ACTIVE', departureDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        select: { destinationCity: true, departureDate: true },
        orderBy: { departureDate: 'asc' }, take: 1,
      },
    },
    orderBy: [{ availabilityUpdatedAt: 'desc' }, { name: 'asc' }],
  });
  return users.filter((user) => user.vehicle).map((user) => ({
    id: user.id,
    name: user.name,
    city: user.city,
    availabilityUpdatedAt: user.availabilityUpdatedAt,
    profilePhoto: user.image,
    vehicleType: user.vehicle.type,
    capacityTons: Number(user.vehicle.capacityTons),
    volumeM3: user.vehicle.volumeM3 == null ? null : Number(user.vehicle.volumeM3),
    intendedDestination: user.journeyPlans[0]?.destinationCity || null,
    plannedDepartureDate: user.journeyPlans[0]?.departureDate || null,
    availableDays: user.availableDays,
  }));
}

export function findProfilePhotoByUserId(id) {
  return prisma.user.findUnique({ where: { id }, select: { image: true } });
}

export async function findVehicleByUserId(userId) {
  const vehicle = await prisma.vehicle.findUnique({ where: { userId }, select: vehicleSelect });
  return vehicle
    ? {
        ...vehicle,
        capacityTons: Number(vehicle.capacityTons),
        volumeM3: vehicle.volumeM3 != null ? Number(vehicle.volumeM3) : null,
      }
    : null;
}

export async function upsertVehicle(userId, input) {
  const vehicle = await prisma.vehicle.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
    select: vehicleSelect,
  });

  return {
    ...vehicle,
    capacityTons: Number(vehicle.capacityTons),
    volumeM3: vehicle.volumeM3 != null ? Number(vehicle.volumeM3) : null,
  };
}
