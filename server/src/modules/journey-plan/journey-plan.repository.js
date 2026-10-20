import { prisma } from '../../shared/db/prisma.js';
import { getLoadFraction, normalizeLoadSize } from '../../shared/constants/loadSizes.js';

const planSelect = {
  id: true,
  transporterId: true,
  originCity: true,
  destinationCity: true,
  departureDate: true,
  fullLoadPrice: true,
  status: true,
  allocatedLoadFraction: true,
  maxWeightKg: true,
  maxVolumeM3: true,
  allocatedWeightKg: true,
  allocatedVolumeM3: true,
  createdAt: true,
  updatedAt: true,
  transporter: {
    select: {
      vehicle: {
        select: {
          capacityTons: true,
          volumeM3: true,
        },
      },
    },
  },
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

export function updateJourneyPlan(id, data) {
  return prisma.journeyPlan.update({ where: { id }, data, select: planSelect });
}

export function deleteJourneyPlan(id) {
  return prisma.journeyPlan.delete({ where: { id }, select: planSelect });
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
          loadSize: true,
          weightKg: true,
          volumeM3: true,
          assignedAt: true,
          shipment: {
            select: {
              id: true,
              goodsDescription: true,
              goodsType: true,
              loadSize: true,
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
    orderBy: [{ createdAt: 'desc' }, { departureDate: 'asc' }],
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
          loadSize: true,
          weightKg: true,
          volumeM3: true,
          assignedAt: true,
          shipment: {
            select: {
              id: true,
              goodsDescription: true,
              goodsType: true,
              loadSize: true,
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
          loadSize: true,
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

export async function assignBidToPlanWithCapacityCheck({ planId, bidId, shipmentId, loadSize = 'FULL_LOAD', weightKg, volumeM3 }) {
  const normalizedLoadSize = normalizeLoadSize(loadSize);
  const isSmallLoad = normalizedLoadSize === 'SMALL_LOAD';
  return prisma.$transaction(async (tx) => {
    const plan = await tx.journeyPlan.findUnique({
      where: { id: planId },
      include: {
        transporter: {
          select: {
            vehicle: {
              select: { capacityTons: true, volumeM3: true },
            },
          },
        },
      },
    });
    if (!plan) return { notFound: true };

    const vehicleCapacityKg = plan.transporter?.vehicle?.capacityTons != null
      ? Number(plan.transporter.vehicle.capacityTons) * 1000
      : null;
    const maxWeight = vehicleCapacityKg || (plan.maxWeightKg != null ? Number(plan.maxWeightKg) : 10000);
    const maxVolume = plan.transporter?.vehicle?.volumeM3 != null
      ? Number(plan.transporter.vehicle.volumeM3)
      : (plan.maxVolumeM3 !== null ? Number(plan.maxVolumeM3) : null);

    const allocatedWeight = Number(plan.allocatedWeightKg || 0);
    const allocatedVolume = Number(plan.allocatedVolumeM3 || 0);
    // Exact entered mass for small load, fraction of maxWeight for other loads
    const addedWeight = isSmallLoad ? Number(weightKg || 0) : maxWeight * getLoadFraction(normalizedLoadSize);
    const addedVolume = isSmallLoad
      ? Number(volumeM3 || 0)
      : maxVolume !== null ? maxVolume * getLoadFraction(normalizedLoadSize) : 0;
    const newWeight = allocatedWeight + addedWeight;
    const newVolume = allocatedVolume + addedVolume;

    if (newWeight > maxWeight + 0.01) {
      return { exceedsWeight: true, remainingWeight: Math.max(0, maxWeight - allocatedWeight), addedWeight };
    }

    const newFraction = Math.min(1, maxWeight > 0 ? newWeight / maxWeight : 0);

    const assignment = await tx.journeyPlanAssignment.create({
      data: {
        journeyPlanId: planId,
        shipmentId,
        bidId,
        loadSize: normalizedLoadSize,
        weightKg: addedWeight,
        volumeM3: maxVolume !== null || isSmallLoad ? addedVolume : null,
      },
    });

    // Remaining capacity and isFull is strictly calculated for mass (volume ignored)
    const isFull = newWeight >= maxWeight - 0.01;

    const updatedPlan = await tx.journeyPlan.update({
      where: { id: planId },
      data: {
        maxWeightKg: maxWeight,
        maxVolumeM3: maxVolume,
        allocatedLoadFraction: newFraction,
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
