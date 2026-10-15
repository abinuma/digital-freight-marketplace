import { AppError } from '../../shared/utils/AppError.js';
import * as journeyPlanRepository from './journey-plan.repository.js';
import * as notificationService from '../notification/notification.service.js';

export function toApiPlan(plan) {
  if (!plan) return null;
  const maxWeightKg = Number(plan.maxWeightKg);
  const maxVolumeM3 = plan.maxVolumeM3 !== null ? Number(plan.maxVolumeM3) : null;
  const allocatedWeightKg = Number(plan.allocatedWeightKg);
  const allocatedVolumeM3 = Number(plan.allocatedVolumeM3);

  const remainingWeightKg = Math.max(0, maxWeightKg - allocatedWeightKg);
  const remainingVolumeM3 = maxVolumeM3 !== null ? Math.max(0, maxVolumeM3 - allocatedVolumeM3) : null;
  const isFull =
    plan.status === 'FULL' ||
    allocatedWeightKg >= maxWeightKg ||
    (maxVolumeM3 !== null && allocatedVolumeM3 >= maxVolumeM3);

  const apiPlan = {
    ...plan,
    fullLoadPrice: Number(plan.fullLoadPrice),
    maxWeightKg,
    maxVolumeM3,
    allocatedWeightKg,
    allocatedVolumeM3,
    remainingWeightKg,
    remainingVolumeM3,
    isFull,
  };

  if (plan.assignments) {
    apiPlan.assignments = plan.assignments.map((assignment) => ({
      ...assignment,
      weightKg: Number(assignment.weightKg),
      volumeM3: assignment.volumeM3 !== null ? Number(assignment.volumeM3) : null,
      shipment: assignment.shipment
        ? {
            ...assignment.shipment,
            weightKg: Number(assignment.shipment.weightKg),
            volumeM3: assignment.shipment.volumeM3 !== null ? Number(assignment.shipment.volumeM3) : null,
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
  const maxVolumeM3 = vehicle.volumeM3 !== null ? Number(vehicle.volumeM3) : null;

  const plan = await journeyPlanRepository.createJourneyPlan({
    transporterId: user.id,
    originCity: input.originCity,
    destinationCity: input.destinationCity,
    departureDate: new Date(`${input.departureDate}T00:00:00.000Z`),
    fullLoadPrice: input.fullLoadPrice,
    maxWeightKg,
    maxVolumeM3,
  });

  return toApiPlan(plan);
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

  if (bid.journeyPlanAssignment) {
    throw new AppError('This accepted load is already assigned to a journey plan', 409);
  }

  const weightKg = Number(bid.shipment.weightKg);
  const volumeM3 = bid.shipment.volumeM3 !== null && bid.shipment.volumeM3 !== undefined
    ? Number(bid.shipment.volumeM3)
    : null;

  const result = await journeyPlanRepository.assignBidToPlanWithCapacityCheck({
    planId,
    bidId,
    shipmentId: bid.shipmentId,
    weightKg,
    volumeM3,
  });

  if (result.notFound) {
    throw new AppError('Journey plan was not found', 404);
  }

  if (result.exceedsWeight) {
    throw new AppError(
      `Load weight (${weightKg} kg) exceeds remaining plan capacity (${result.remainingWeight} kg). Please choose another suitable plan or create a new one.`,
      400
    );
  }

  if (result.exceedsVolume) {
    throw new AppError(
      `Load volume (${volumeM3} m³) exceeds remaining plan volume (${result.remainingVolume} m³). Please choose another suitable plan or create a new one.`,
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
