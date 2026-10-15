-- CreateEnum
CREATE TYPE "JourneyPlanStatus" AS ENUM ('ACTIVE', 'FULL', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "volumeM3" DECIMAL(10,2);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JourneyPlan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transporterId" UUID NOT NULL,
    "originCity" VARCHAR(100) NOT NULL,
    "destinationCity" VARCHAR(100) NOT NULL,
    "departureDate" DATE NOT NULL,
    "fullLoadPrice" DECIMAL(12,2) NOT NULL,
    "status" "JourneyPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxWeightKg" DECIMAL(10,2) NOT NULL,
    "maxVolumeM3" DECIMAL(10,2),
    "allocatedWeightKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "allocatedVolumeM3" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JourneyPlanAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "journeyPlanId" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "bidId" UUID NOT NULL,
    "weightKg" DECIMAL(10,2) NOT NULL,
    "volumeM3" DECIMAL(10,2),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyPlanAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_journey_plan_transporter_status" ON "JourneyPlan"("transporterId", "status");
CREATE INDEX IF NOT EXISTS "idx_journey_plan_departure_date" ON "JourneyPlan"("departureDate");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "JourneyPlanAssignment_bidId_key" ON "JourneyPlanAssignment"("bidId");
CREATE INDEX IF NOT EXISTS "idx_journey_assignment_plan" ON "JourneyPlanAssignment"("journeyPlanId");
CREATE INDEX IF NOT EXISTS "idx_journey_assignment_shipment" ON "JourneyPlanAssignment"("shipmentId");

-- AddForeignKey
ALTER TABLE "JourneyPlan" DROP CONSTRAINT IF EXISTS "JourneyPlan_transporterId_fkey";
ALTER TABLE "JourneyPlan" ADD CONSTRAINT "JourneyPlan_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyPlanAssignment" DROP CONSTRAINT IF EXISTS "JourneyPlanAssignment_journeyPlanId_fkey";
ALTER TABLE "JourneyPlanAssignment" ADD CONSTRAINT "JourneyPlanAssignment_journeyPlanId_fkey" FOREIGN KEY ("journeyPlanId") REFERENCES "JourneyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyPlanAssignment" DROP CONSTRAINT IF EXISTS "JourneyPlanAssignment_shipmentId_fkey";
ALTER TABLE "JourneyPlanAssignment" ADD CONSTRAINT "JourneyPlanAssignment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyPlanAssignment" DROP CONSTRAINT IF EXISTS "JourneyPlanAssignment_bidId_fkey";
ALTER TABLE "JourneyPlanAssignment" ADD CONSTRAINT "JourneyPlanAssignment_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
