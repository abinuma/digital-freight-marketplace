CREATE TABLE "ShipmentModeration" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "adminId" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentModeration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_shipment_moderation_shipment_created"
ON "ShipmentModeration"("shipmentId", "createdAt" DESC);

CREATE INDEX "idx_shipment_moderation_admin"
ON "ShipmentModeration"("adminId");

ALTER TABLE "ShipmentModeration"
ADD CONSTRAINT "ShipmentModeration_shipmentId_fkey"
FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShipmentModeration"
ADD CONSTRAINT "ShipmentModeration_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
