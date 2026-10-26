CREATE TYPE "ShipmentStatus_new" AS ENUM ('PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

ALTER TABLE "Shipment"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ShipmentStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'DRAFT' THEN 'CANCELLED'
      ELSE "status"::text
    END
  )::"ShipmentStatus_new";

DROP TYPE "ShipmentStatus";
ALTER TYPE "ShipmentStatus_new" RENAME TO "ShipmentStatus";

ALTER TABLE "Shipment"
  ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';
