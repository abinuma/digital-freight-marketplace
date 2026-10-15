import { prisma } from '../../shared/db/prisma.js';

const planSelect = {
  id: true,
  transporterId: true,
  originCity: true,
  destinationCity: true,
  departureDate: true,
  fullLoadPrice: true,
  status: true,
  maxWeightKg: true,
  maxVolumeM3: true,
  allocatedWeightKg: true,
  allocatedVolumeM3: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { assignments: true },
  },
};

export function findTransporterVehicle(userId) {
  return prisma.vehicle.findUnique({
    where: { userId },
    select: { id: true, capacityTons: true, volumeM3: true },
  });
}

export function createJourneyPlan(data) {
  return prisma.journeyPlan.create({
    data,
    select: planSelect,
  });
}

export function findJourneyPlansByTransporter(transporterId, status) {
  return prisma.journeyPlan.findMany({
    where: {
      transporterId,
      ...(status ? { status } : {}),
    },
    select: {
      ...planSelect,
      assignments: {
        select: {
          id: true,
          shipmentId: true,
          bidId: true,
          weightKg: true,
          volumeM3: true,
          assignedAt: true,
          shipment: {
            select: {
              id: true,
              goodsDescription: true,
              goodsType: true,
              weightKg: true,
              volumeM3: true,
              pickupLocation: true,
              deliveryLocation: true,
              status: true,
            },
          },
        },
        orderBy: { assignedAt: 'asc' },
      },
    },
    orderBy: [{ departureDate: 'asc' }, { createdAt: 'desc' }],
  });
}

export function findJourneyPlanById(id) {
  return prisma.journeyPlan.findUnique({
    where: { id },
    select: {
      ...planSelect,
      assignments: {
        select: {
          id: true,
          shipmentId: true,
          bidId: true,
          weightKg: true,
          volumeM3: true,
          assignedAt: true,
          shipment: {
            select: {
              id: true,
              goodsDescription: true,
              goodsType: true,
              weightKg: true,
              volumeM3: true,
              pickupLocation: true,
              deliveryLocation: true,
              status: true,
            },
          },
        },
        orderBy: { assignedAt: 'asc' },
      },
    },
  });
}

export function findAcceptedBidForAssignment(bidId, transporterId) {
  return prisma.bid.findFirst({
    where: {
      id: bidId,
      transporterId,
    },
    select: {
      id: true,
      shipmentId: true,
      transporterId: true,
      status: true,
      shipment: {
        select: {
          id: true,
          weightKg: true,
          volumeM3: true,
          goodsDescription: true,
          pickupLocation: true,
          deliveryLocation: true,
        },
      },
      journeyPlanAssignment: {
        select: {
          id: true,
          journeyPlanId: true,
        },
      },
    },
  });
}

export async function assignBidToPlanWithCapacityCheck({ planId, bidId, shipmentId, weightKg, volumeM3 }) {
  return prisma.$transaction(async (tx) => {
    const plan = await tx.journeyPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) return { notFound: true };

    const allocatedWeight = Number(plan.allocatedWeightKg);
    const allocatedVolume = Number(plan.allocatedVolumeM3);
    const maxWeight = Number(plan.maxWeightKg);
    const maxVolume = plan.maxVolumeM3 !== null ? Number(plan.maxVolumeM3) : null;

    const remainingWeight = maxWeight - allocatedWeight;
    const remainingVolume = maxVolume !== null ? maxVolume - allocatedVolume : null;

    if (weightKg > remainingWeight) {
      return {
        exceedsWeight: true,
        remainingWeight,
        remainingVolume,
      };
    }

    if (remainingVolume !== null && volumeM3 !== null && volumeM3 !== undefined && volumeM3 > remainingVolume) {
      return {
        exceedsVolume: true,
        remainingWeight,
        remainingVolume,
      };
    }

    const assignment = await tx.journeyPlanAssignment.create({
      data: {
        journeyPlanId: planId,
        shipmentId,
        bidId,
        weightKg,
        volumeM3: volumeM3 ?? null,
      },
    });

    const newWeight = allocatedWeight + weightKg;
    const newVolume = allocatedVolume + (volumeM3 || 0);

    const isFull = newWeight >= maxWeight || (maxVolume !== null && newVolume >= maxVolume);

    const updatedPlan = await tx.journeyPlan.update({
      where: { id: planId },
      data: {
        allocatedWeightKg: newWeight,
        allocatedVolumeM3: newVolume,
        status: isFull ? 'FULL' : plan.status,
      },
      select: planSelect,
    });

    return {
      assignment,
      updatedPlan,
      isFull,
    };
  });
}
