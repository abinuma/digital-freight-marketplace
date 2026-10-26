import { prisma } from "../../shared/db/prisma.js";
import { getLoadFraction } from "../../shared/constants/loadSizes.js";

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
  loadSize: true,
  capacityTons: true,
  plateNumber: true,
  photo: true,
  createdAt: true,
  updatedAt: true,
};

export async function findPublicProfileById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { ...publicUserSelect, email: true },
  });
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
  const targetCity = (city || "").trim();
  if (!targetCity) return [];

  const users = await prisma.user.findMany({
    where: {
      role: "TRANSPORTER",
      status: "ACTIVE",
      lookingForLoads: true,
      OR: [
        { city: { equals: targetCity, mode: "insensitive" } },
        { city: { contains: targetCity, mode: "insensitive" } },
        { location: { contains: targetCity, mode: "insensitive" } },
        {
          journeyPlans: {
            some: {
              status: "ACTIVE",
              originCity: { equals: targetCity, mode: "insensitive" },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      city: true,
      location: true,
      availabilityUpdatedAt: true,
      image: true,
      availableDays: true,
      preferredLoadTypes: true,
      reviewsReceived: { select: { rating: true } },
      vehicle: {
        select: { type: true, loadSize: true, capacityTons: true, photo: true },
      },
      journeyPlans: {
        where: {
          status: "ACTIVE",
          departureDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        select: { destinationCity: true, departureDate: true },
        orderBy: { departureDate: "asc" },
        take: 1,
      },
    },
    orderBy: [{ availabilityUpdatedAt: "desc" }, { name: "asc" }],
  });

  return users.map((user) => {
    const reviewCount = user.reviewsReceived.length;
    const averageRating = reviewCount
      ? user.reviewsReceived.reduce(
          (total, review) => total + review.rating,
          0,
        ) / reviewCount
      : null;

    return {
      id: user.id,
      name: user.name,
      city: user.city || targetCity,
      availabilityUpdatedAt: user.availabilityUpdatedAt,
      profilePhoto: user.image,
      vehicleType: user.vehicle?.type || "Truck (details pending)",
      loadSize: user.vehicle?.loadSize || "FULL_LOAD",
      capacityTons:
        user.vehicle && user.vehicle.capacityTons != null
          ? Number(user.vehicle.capacityTons)
          : 0,
      vehiclePhoto: user.vehicle?.photo || null,
      intendedDestination: user.journeyPlans[0]?.destinationCity || null,
      plannedDepartureDate: user.journeyPlans[0]?.departureDate || null,
      availableDays: user.availableDays,
      preferredLoadTypes: user.preferredLoadTypes || [],
      averageRating,
      reviewCount,
    };
  });
}

export function findProfilePhotoByUserId(id) {
  return prisma.user.findUnique({ where: { id }, select: { image: true } });
}

export async function findVehicleByUserId(userId) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { userId },
    select: vehicleSelect,
  });
  if (!vehicle) return null;
  const tons =
    vehicle.capacityTons != null ? Number(vehicle.capacityTons) : null;

  return {
    ...vehicle,
    loadSize: vehicle.loadSize || "FULL_LOAD",
    capacityTons: tons,
    capacityKg: tons != null ? Math.round(tons * 1000) : null,
  };
}

export async function upsertVehicle(userId, input) {
  const { capacityKg, ...rest } = input;
  const data = {
    ...rest,
    capacityTons:
      rest.capacityTons !== undefined
        ? rest.capacityTons
        : capacityKg !== undefined
          ? capacityKg / 1000
          : undefined,
  };
  const vehicle = await prisma.vehicle.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: vehicleSelect,
  });

  const tons =
    vehicle.capacityTons != null ? Number(vehicle.capacityTons) : null;
  if (tons != null) {
    const maxWeightKg = tons * 1000;
    const activePlans = await prisma.journeyPlan
      .findMany({
        where: { transporterId: userId, status: { in: ["ACTIVE", "FULL"] } },
        include: { assignments: true },
      })
      .catch(() => []);

    for (const plan of activePlans) {
      let allocatedWeight = 0;
      for (const assignment of plan.assignments) {
        const isSmall = assignment.loadSize === "SMALL_LOAD";
        allocatedWeight += isSmall
          ? Number(assignment.weightKg || 0)
          : maxWeightKg * getLoadFraction(assignment.loadSize);
      }
      const newFraction = Math.min(
        1,
        maxWeightKg > 0 ? allocatedWeight / maxWeightKg : 0,
      );
      const isFull = allocatedWeight >= maxWeightKg - 0.01;
      await prisma.journeyPlan
        .update({
          where: { id: plan.id },
          data: {
            maxWeightKg,
            allocatedWeightKg: allocatedWeight,
            allocatedLoadFraction: newFraction,
            status: isFull ? "FULL" : "ACTIVE",
          },
        })
        .catch(() => undefined);
    }
  }

  return {
    ...vehicle,
    loadSize: vehicle.loadSize || "FULL_LOAD",
    capacityTons: tons,
    capacityKg: tons != null ? Math.round(tons * 1000) : null,
  };
}

export async function updateVehiclePhoto(userId, photoUrl) {
  const vehicle = await prisma.vehicle.update({
    where: { userId },
    data: { photo: photoUrl },
    select: vehicleSelect,
  });

  return {
    ...vehicle,
    capacityTons: Number(vehicle.capacityTons),
  };
}
