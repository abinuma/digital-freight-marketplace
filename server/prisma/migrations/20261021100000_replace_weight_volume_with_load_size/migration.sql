-- AlterTable Shipment
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "loadSize" VARCHAR(50) NOT NULL DEFAULT 'FULL_LOAD';
ALTER TABLE "Shipment" ALTER COLUMN "weightKg" DROP NOT NULL;
ALTER TABLE "Shipment" ALTER COLUMN "volumeM3" DROP NOT NULL;

-- AlterTable Vehicle
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "loadSize" VARCHAR(50) DEFAULT 'FULL_LOAD';
ALTER TABLE "Vehicle" ALTER COLUMN "capacityTons" DROP NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "volumeM3" DROP NOT NULL;

-- AlterTable JourneyPlan
ALTER TABLE "JourneyPlan" ADD COLUMN IF NOT EXISTS "allocatedLoadFraction" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "JourneyPlan" ALTER COLUMN "maxWeightKg" DROP NOT NULL;
ALTER TABLE "JourneyPlan" ALTER COLUMN "allocatedWeightKg" DROP NOT NULL;

-- AlterTable JourneyPlanAssignment
ALTER TABLE "JourneyPlanAssignment" ADD COLUMN IF NOT EXISTS "loadSize" VARCHAR(50);
ALTER TABLE "JourneyPlanAssignment" ALTER COLUMN "weightKg" DROP NOT NULL;
