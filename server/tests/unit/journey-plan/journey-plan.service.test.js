import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as journeyPlanService from '../../../src/modules/journey-plan/journey-plan.service.js';
import * as journeyPlanRepository from '../../../src/modules/journey-plan/journey-plan.repository.js';
import * as notificationService from '../../../src/modules/notification/notification.service.js';

vi.mock('../../../src/modules/journey-plan/journey-plan.repository.js', () => ({
  findTransporterVehicle: vi.fn(),
  createJourneyPlan: vi.fn(),
  findJourneyPlansByTransporter: vi.fn(),
  findJourneyPlanById: vi.fn(),
  findAcceptedBidForAssignment: vi.fn(),
  assignBidToPlanWithCapacityCheck: vi.fn(),
}));

vi.mock('../../../src/modules/notification/notification.service.js', () => ({
  journeyPlanCapacityReached: vi.fn(),
}));

describe('journey-plan service', () => {
  const transporter = { id: 'transporter-id', role: 'TRANSPORTER' };
  const shipper = { id: 'shipper-id', role: 'SHIPPER' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createJourneyPlan', () => {
    it('rejects non-transporters', async () => {
      await expect(
        journeyPlanService.createJourneyPlan(shipper, {
          originCity: 'Adama',
          destinationCity: 'Hawassa',
          departureDate: '2026-10-20',
          fullLoadPrice: 15000,
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rejects if transporter has no vehicle registered', async () => {
      journeyPlanRepository.findTransporterVehicle.mockResolvedValue(null);

      await expect(
        journeyPlanService.createJourneyPlan(transporter, {
          originCity: 'Adama',
          destinationCity: 'Hawassa',
          departureDate: '2026-10-20',
          fullLoadPrice: 15000,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('register your vehicle'),
      });
    });

    it('creates journey plan calculating limits from vehicle', async () => {
      journeyPlanRepository.findTransporterVehicle.mockResolvedValue({
        id: 'vehicle-id',
        capacityTons: 5,
      });

      journeyPlanRepository.createJourneyPlan.mockResolvedValue({
        id: 'plan-id',
        transporterId: transporter.id,
        originCity: 'Adama',
        destinationCity: 'Hawassa',
        departureDate: new Date('2026-10-20'),
        fullLoadPrice: 15000,
        status: 'ACTIVE',
        maxWeightKg: 5000,
        allocatedWeightKg: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { assignments: 0 },
      });

      const plan = await journeyPlanService.createJourneyPlan(transporter, {
        originCity: 'Adama',
        destinationCity: 'Hawassa',
        departureDate: '2026-10-20',
        fullLoadPrice: 15000,
      });

      expect(plan.id).toBe('plan-id');
      expect(plan.maxWeightKg).toBe(5000);
      expect(plan.remainingWeightKg).toBe(5000);
      expect(plan.isFull).toBe(false);
    });

    it('creates journey plan when departureDate is an ISO datetime string', async () => {
      journeyPlanRepository.findTransporterVehicle.mockResolvedValue({
        id: 'vehicle-id',
        capacityTons: 5,
      });

      journeyPlanRepository.createJourneyPlan.mockResolvedValue({
        id: 'plan-id-2',
        transporterId: transporter.id,
        originCity: 'Adama',
        destinationCity: 'Hawassa',
        departureDate: new Date('2026-10-20T14:30:00.000Z'),
        fullLoadPrice: 15000,
        status: 'ACTIVE',
        maxWeightKg: 5000,
        allocatedWeightKg: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { assignments: 0 },
      });

      const plan = await journeyPlanService.createJourneyPlan(transporter, {
        originCity: 'Adama',
        destinationCity: 'Hawassa',
        departureDate: '2026-10-20T14:30:00.000Z',
        fullLoadPrice: 15000,
      });

      expect(plan.id).toBe('plan-id-2');
      expect(journeyPlanRepository.createJourneyPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          departureDate: new Date('2026-10-20T14:30:00.000Z'),
        })
      );
    });
  });

  describe('assignBidToJourneyPlan', () => {
    it('rejects if load weight exceeds plan remaining capacity', async () => {
      journeyPlanRepository.findJourneyPlanById.mockResolvedValue({
        id: 'plan-id',
        transporterId: transporter.id,
        originCity: 'Adama',
        destinationCity: 'Hawassa',
        status: 'ACTIVE',
        maxWeightKg: 5000,
        allocatedWeightKg: 4000,
      });

      journeyPlanRepository.findAcceptedBidForAssignment.mockResolvedValue({
        id: 'bid-id',
        shipmentId: 'shipment-id',
        transporterId: transporter.id,
        status: 'ACCEPTED',
        shipment: {
          id: 'shipment-id',
          weightKg: 1500,
        },
      });

      journeyPlanRepository.assignBidToPlanWithCapacityCheck.mockResolvedValue({
        exceedsWeight: true,
        remainingWeight: 1000,
      });

      await expect(
        journeyPlanService.assignBidToJourneyPlan(transporter, 'plan-id', 'bid-id')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('exceeds remaining plan capacity'),
      });
    });

    it('successfully assigns load and triggers capacity notification when full', async () => {
      const plan = {
        id: 'plan-id',
        transporterId: transporter.id,
        originCity: 'Adama',
        destinationCity: 'Hawassa',
        status: 'ACTIVE',
        maxWeightKg: 5000,
        allocatedWeightKg: 3000,
      };

      journeyPlanRepository.findJourneyPlanById.mockResolvedValue(plan);

      journeyPlanRepository.findAcceptedBidForAssignment.mockResolvedValue({
        id: 'bid-id',
        shipmentId: 'shipment-id',
        transporterId: transporter.id,
        status: 'ACCEPTED',
        shipment: {
          id: 'shipment-id',
          weightKg: 2000,
        },
      });

      journeyPlanRepository.assignBidToPlanWithCapacityCheck.mockResolvedValue({
        assignment: {
          id: 'assignment-id',
          journeyPlanId: 'plan-id',
          bidId: 'bid-id',
          shipmentId: 'shipment-id',
          weightKg: 2000,
        },
        updatedPlan: {
          ...plan,
          status: 'FULL',
          allocatedWeightKg: 5000,
        },
        isFull: true,
      });

      const result = await journeyPlanService.assignBidToJourneyPlan(transporter, 'plan-id', 'bid-id');

      expect(result.isFull).toBe(true);
      expect(result.plan.status).toBe('FULL');
      expect(result.plan.remainingWeightKg).toBe(0);
      expect(notificationService.journeyPlanCapacityReached).toHaveBeenCalledWith(
        transporter.id,
        plan
      );
    });
  });
});
