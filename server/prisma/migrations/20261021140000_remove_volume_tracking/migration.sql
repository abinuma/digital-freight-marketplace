-- Freight capacity and shipment load size are tracked by mass only.
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "volumeM3";
ALTER TABLE "Shipment" DROP COLUMN IF EXISTS "volumeM3";
ALTER TABLE "JourneyPlan" DROP COLUMN IF EXISTS "maxVolumeM3";
ALTER TABLE "JourneyPlan" DROP COLUMN IF EXISTS "allocatedVolumeM3";
ALTER TABLE "JourneyPlanAssignment" DROP COLUMN IF EXISTS "volumeM3";
