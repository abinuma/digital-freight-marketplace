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
  allocatedWeightKg: true,
  createdAt: true,
  updatedAt: true,
  transporter: {
    select: {
      vehicle: {
        select: {
          capacityTons: true,
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
    select: { id: true, capacityTons: true },
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
          assignedAt: true,
          shipment: {
            select: {
              id: true,
              goodsDescription: true,
              goodsType: true,
              loadSize: true,
              weightKg: true,
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
          assignedAt: true,
          shipment: {
            select: {
              id: true,
              goodsDescription: true,
              goodsType: true,
              loadSize: true,
              weightKg: true,
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
          status: true,
          loadSize: true,
          weightKg: true,
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

export async function assignBidToPlanWithCapacityCheck({ planId, bidId, shipmentId, loadSize = 'FULL_LOAD', weightKg }) {
  const normalizedLoadSize = normalizeLoadSize(loadSize);
  const isSmallLoad = normalizedLoadSize === 'SMALL_LOAD';
  return prisma.$transaction(async (tx) => {
    const plan = await tx.journeyPlan.findUnique({
      where: { id: planId },
      include: {
        transporter: {
          select: {
            vehicle: {
              select: { capacityTons: true },
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

    const allocatedWeight = Number(plan.allocatedWeightKg || 0);
    // Exact entered mass for small load, fraction of maxWeight for other loads
    const addedWeight = isSmallLoad ? Number(weightKg || 0) : maxWeight * getLoadFraction(normalizedLoadSize);
    const newWeight = allocatedWeight + addedWeight;

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
      },
    });

    // Remaining capacity and isFull are calculated from mass only.
    const isFull = newWeight >= maxWeight - 0.01;

    const updatedPlan = await tx.journeyPlan.update({
      where: { id: planId },
      data: {
        maxWeightKg: maxWeight,
        allocatedLoadFraction: newFraction,
        allocatedWeightKg: newWeight,
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
