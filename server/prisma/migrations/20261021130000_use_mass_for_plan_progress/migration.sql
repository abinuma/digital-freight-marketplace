-- The plan progress percentage represents mass usage. Volume stays separately
-- tracked and continues to participate in assignment fit and full-plan checks.
UPDATE "JourneyPlan"
SET "allocatedLoadFraction" = LEAST(
  1,
  COALESCE("allocatedWeightKg" / NULLIF(COALESCE("maxWeightKg", 10000), 0), 0)
);
