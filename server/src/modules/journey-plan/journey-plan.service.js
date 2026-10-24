import { AppError } from '../../shared/utils/AppError.js';
import * as journeyPlanRepository from './journey-plan.repository.js';
import * as notificationService from '../notification/notification.service.js';
import { getLoadFraction, normalizeLoadSize } from '../../shared/constants/loadSizes.js';

export function toApiPlan(plan) {
  if (!plan) return null;
  const vehicleCapacityKg = plan.transporter?.vehicle?.capacityTons != null
    ? Number(plan.transporter.vehicle.capacityTons) * 1000
    : null;
  const maxWeightKg = vehicleCapacityKg || (plan.maxWeightKg != null ? Number(plan.maxWeightKg) : 10000);

  let allocatedWeightKg = plan.allocatedWeightKg != null ? Number(plan.allocatedWeightKg) : 0;
  if (plan.assignments && plan.assignments.length > 0) {
    allocatedWeightKg = plan.assignments.reduce((sum, a) => {
      const loadSize = normalizeLoadSize(a.shipment?.loadSize || a.loadSize);
      if (loadSize === 'SMALL_LOAD') {
        return sum + Number(a.shipment?.weightKg ?? a.weightKg ?? 0);
      }
      return sum + maxWeightKg * getLoadFraction(loadSize);
    }, 0);
  }

  const allocatedLoadFraction = maxWeightKg > 0
    ? Math.min(1, allocatedWeightKg / maxWeightKg)
    : 0;
  const remainingLoadFraction = Math.max(0, 1.0 - allocatedLoadFraction);
  const remainingWeightKg = Math.max(0, maxWeightKg - allocatedWeightKg);
  const isFull =
    plan.status === 'FULL' ||
    allocatedWeightKg >= maxWeightKg - 0.01;

  const apiPlan = {
    ...plan,
    fullLoadPrice: Number(plan.fullLoadPrice),
    allocatedLoadFraction,
    remainingLoadFraction,
    maxWeightKg,
    allocatedWeightKg,
    remainingWeightKg,
    isFull,
  };

  if (plan.assignments) {
    apiPlan.assignments = plan.assignments.map((assignment) => ({
      ...assignment,
      loadSize: assignment.shipment?.loadSize || assignment.loadSize || 'FULL_LOAD',
      weightKg: assignment.weightKg != null ? Number(assignment.weightKg) : null,
      shipment: assignment.shipment
        ? {
            ...assignment.shipment,
            loadSize: assignment.shipment.loadSize || 'FULL_LOAD',
            weightKg: assignment.shipment.weightKg != null ? Number(assignment.shipment.weightKg) : null,
          }
        : undefined,
    }));
  }

  return apiPlan;
}

export async function createJourneyPlan(user, input) {
  if (user.role !== 'TRANSPORTER') {
    throw new AppError('Only Transporters can create journey plans', 403);
  }

  const vehicle = await journeyPlanRepository.findTransporterVehicle(user.id);
  if (!vehicle) {
    throw new AppError('Please register your vehicle details in your profile before creating a journey plan', 400);
  }

  const maxWeightKg = Number(vehicle.capacityTons) * 1000;

  const departureDate = input.departureDate.includes('T')
    ? new Date(input.departureDate)
    : new Date(`${input.departureDate}T00:00:00.000Z`);

  const plan = await journeyPlanRepository.createJourneyPlan({
    transporterId: user.id,
    originCity: input.originCity,
    destinationCity: input.destinationCity,
    departureDate,
    fullLoadPrice: input.fullLoadPrice,
    maxWeightKg,
  });

  return toApiPlan(plan);
}

export async function updateJourneyPlan(user, id, input) {
  if (user.role !== 'TRANSPORTER') {
    throw new AppError('Only Transporters can update journey plans', 403);
  }
  const plan = await journeyPlanRepository.findJourneyPlanById(id);
  if (!plan) throw new AppError('Journey plan was not found', 404);
  if (plan.transporterId !== user.id) {
    throw new AppError('You can only update your own journey plans', 403);
  }
  if (plan.assignments?.length) {
    throw new AppError('Journey plans with assigned loads cannot be edited', 409);
  }
  if (['COMPLETED', 'CANCELLED'].includes(plan.status)) {
    throw new AppError(`Cannot edit a ${plan.status.toLowerCase()} journey plan`, 409);
  }
  if (input.originCity.toLowerCase() === input.destinationCity.toLowerCase()) {
    throw new AppError('Destination city must be different from origin city', 400);
  }
  const departureDate = input.departureDate.includes('T')
    ? new Date(input.departureDate)
    : new Date(`${input.departureDate}T00:00:00.000Z`);
  return toApiPlan(await journeyPlanRepository.updateJourneyPlan(id, {
    originCity: input.originCity,
    destinationCity: input.destinationCity,
    departureDate,
    fullLoadPrice: input.fullLoadPrice,
  }));
}

export async function deleteJourneyPlan(user, id) {
  if (user.role !== 'TRANSPORTER') {
    throw new AppError('Only Transporters can delete journey plans', 403);
  }
  const plan = await journeyPlanRepository.findJourneyPlanById(id);
  if (!plan) throw new AppError('Journey plan was not found', 404);
  if (plan.transporterId !== user.id) {
    throw new AppError('You can only delete your own journey plans', 403);
  }
  return toApiPlan(await journeyPlanRepository.deleteJourneyPlan(id));
}

export async function listMyJourneyPlans(user, query = {}) {
  if (user.role !== 'TRANSPORTER') {
    throw new AppError('Only Transporters can view their journey plans', 403);
  }

  const plans = await journeyPlanRepository.findJourneyPlansByTransporter(user.id, query.status);
  return plans.map(toApiPlan);
}

export async function getJourneyPlan(user, id) {
  const plan = await journeyPlanRepository.findJourneyPlanById(id);
  if (!plan) throw new AppError('Journey plan was not found', 404);

  if (user.role !== 'ADMIN' && plan.transporterId !== user.id) {
    throw new AppError('You are not authorized to view this journey plan', 403);
  }

  return toApiPlan(plan);
}

export async function assignBidToJourneyPlan(user, planId, bidId) {
  if (user.role !== 'TRANSPORTER') {
    throw new AppError('Only Transporters can assign loads to a journey plan', 403);
  }

  const plan = await journeyPlanRepository.findJourneyPlanById(planId);
  if (!plan) throw new AppError('Journey plan was not found', 404);

  if (plan.transporterId !== user.id) {
    throw new AppError('You can only assign loads to your own journey plans', 403);
  }

  if (plan.status === 'COMPLETED' || plan.status === 'CANCELLED') {
    throw new AppError(`Cannot assign loads to a ${plan.status.toLowerCase()} journey plan`, 400);
  }

  const bid = await journeyPlanRepository.findAcceptedBidForAssignment(bidId, user.id);
  if (!bid) {
    throw new AppError('Accepted bid was not found or is not eligible for assignment', 404);
  }

  if (bid.status !== 'ACCEPTED') {
    throw new AppError('Only accepted bids can be assigned to a journey plan', 400);
  }

  if (bid.shipment.status === 'COMPLETED') {
    throw new AppError('A delivered shipment cannot be assigned to a journey plan', 400);
  }

  if (bid.journeyPlanAssignment) {
    throw new AppError('This accepted load is already assigned to a journey plan', 409);
  }

  const loadSize = normalizeLoadSize(bid.shipment.loadSize);
  const weightKg = bid.shipment.weightKg != null ? Number(bid.shipment.weightKg) : null;
  if (loadSize === 'SMALL_LOAD' && !(weightKg > 0)) {
    throw new AppError('Small loads must include weight before assignment', 400);
  }

  const result = await journeyPlanRepository.assignBidToPlanWithCapacityCheck({
    planId,
    bidId,
    shipmentId: bid.shipmentId,
    loadSize,
    weightKg,
  });

  if (result.notFound) {
    throw new AppError('Journey plan was not found', 404);
  }

  if (result.exceedsWeight) {
    throw new AppError(
      `Load weight (${result.addedWeight ?? weightKg} kg) exceeds remaining plan capacity (${result.remainingWeight} kg). Please choose another suitable plan or create a new one.`,
      400
    );
  }

  if (result.isFull) {
    await notificationService.journeyPlanCapacityReached(user.id, plan);
  }

  return {
    assignment: result.assignment,
    plan: toApiPlan(result.updatedPlan),
    isFull: result.isFull,
  };
}
