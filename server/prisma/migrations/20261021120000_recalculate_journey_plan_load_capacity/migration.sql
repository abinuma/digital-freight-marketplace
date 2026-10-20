-- Use the shipment's saved load size as the source of truth for old assignments.
UPDATE "JourneyPlanAssignment" AS assignment
SET "loadSize" = UPPER(REPLACE(TRIM(COALESCE(shipment."loadSize", 'FULL_LOAD')), ' ', '_'))
FROM "Shipment" AS shipment
WHERE shipment."id" = assignment."shipmentId";

-- Store the vehicle capacity consumed by each assignment. Standard load sizes
-- consume the same fraction of vehicle mass and volume; small loads use the
-- shipper-provided mass and volume.
UPDATE "JourneyPlanAssignment" AS assignment
SET
  "weightKg" = CASE assignment."loadSize"
    WHEN 'HALF_LOAD' THEN COALESCE(plan."maxWeightKg", 10000) * 0.5
    WHEN 'QUARTER_LOAD' THEN COALESCE(plan."maxWeightKg", 10000) * 0.25
    WHEN 'SMALL_LOAD' THEN COALESCE(shipment."weightKg", 0)
    ELSE COALESCE(plan."maxWeightKg", 10000)
  END,
  "volumeM3" = CASE
    WHEN assignment."loadSize" = 'SMALL_LOAD' THEN COALESCE(shipment."volumeM3", 0)
    WHEN plan."maxVolumeM3" IS NULL THEN NULL
    WHEN assignment."loadSize" = 'HALF_LOAD' THEN plan."maxVolumeM3" * 0.5
    WHEN assignment."loadSize" = 'QUARTER_LOAD' THEN plan."maxVolumeM3" * 0.25
    ELSE plan."maxVolumeM3"
  END
FROM "Shipment" AS shipment, "JourneyPlan" AS plan
WHERE shipment."id" = assignment."shipmentId"
  AND plan."id" = assignment."journeyPlanId";

ALTER TABLE "JourneyPlan"
  ALTER COLUMN "allocatedLoadFraction" TYPE DECIMAL(5,4)
  USING "allocatedLoadFraction"::DECIMAL(5,4);

-- Rebuild each plan's allocation totals and status from its corrected assignments.
WITH allocation_totals AS (
  SELECT
    plan."id",
    COALESCE(SUM(assignment."weightKg"), 0) AS "allocatedWeightKg",
    COALESCE(SUM(assignment."volumeM3"), 0) AS "allocatedVolumeM3"
  FROM "JourneyPlan" AS plan
  LEFT JOIN "JourneyPlanAssignment" AS assignment
    ON assignment."journeyPlanId" = plan."id"
  GROUP BY plan."id"
)
UPDATE "JourneyPlan" AS plan
SET
  "allocatedWeightKg" = totals."allocatedWeightKg",
  "allocatedVolumeM3" = totals."allocatedVolumeM3",
  "allocatedLoadFraction" = LEAST(1, GREATEST(
    COALESCE(totals."allocatedWeightKg" / NULLIF(COALESCE(plan."maxWeightKg", 10000), 0), 0),
    COALESCE(totals."allocatedVolumeM3" / NULLIF(plan."maxVolumeM3", 0), 0)
  )),
  "status" = CASE
    WHEN plan."status" IN ('COMPLETED', 'CANCELLED') THEN plan."status"
    WHEN totals."allocatedWeightKg" >= COALESCE(plan."maxWeightKg", 10000)
      OR (plan."maxVolumeM3" IS NOT NULL AND totals."allocatedVolumeM3" >= plan."maxVolumeM3") THEN 'FULL'::"JourneyPlanStatus"
    ELSE 'ACTIVE'::"JourneyPlanStatus"
  END
FROM allocation_totals AS totals
WHERE totals."id" = plan."id";
