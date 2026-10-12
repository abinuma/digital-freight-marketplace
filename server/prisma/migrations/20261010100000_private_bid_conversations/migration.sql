CREATE TABLE "Conversation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shipmentId" UUID NOT NULL,
    "transporterId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idx_conversation_shipment_transporter"
    ON "Conversation"("shipmentId", "transporterId");
CREATE INDEX "idx_conversation_transporter_updated"
    ON "Conversation"("transporterId", "updatedAt" DESC);
CREATE INDEX "idx_conversation_shipment_updated"
    ON "Conversation"("shipmentId", "updatedAt" DESC);

ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_shipmentId_fkey"
    FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_transporterId_fkey"
    FOREIGN KEY ("transporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Message" ADD COLUMN "conversationId" UUID;

-- Create a private conversation for every existing shipper/transporter bid pair.
INSERT INTO "Conversation" ("id", "shipmentId", "transporterId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "shipmentId", "transporterId", MIN("createdAt"), MAX("updatedAt")
FROM "Bid"
GROUP BY "shipmentId", "transporterId";

-- Transporter-authored messages can be assigned to their own conversation.
UPDATE "Message" AS message
SET "conversationId" = conversation."id"
FROM "Conversation" AS conversation
WHERE conversation."shipmentId" = message."shipmentId"
  AND conversation."transporterId" = message."senderId";

-- Assign shipper-authored history only when there was one possible transporter.
-- Shared legacy messages from shipments with multiple bidders remain unassigned,
-- since their intended recipient cannot be identified safely.
WITH sole_transporter AS (
    SELECT bid."shipmentId", (ARRAY_AGG(DISTINCT bid."transporterId"))[1] AS "transporterId"
    FROM "Bid" AS bid
    GROUP BY bid."shipmentId"
    HAVING COUNT(DISTINCT bid."transporterId") = 1
)
UPDATE "Message" AS message
SET "conversationId" = conversation."id"
FROM "Shipment" AS shipment
JOIN sole_transporter ON sole_transporter."shipmentId" = shipment."id"
JOIN "Conversation" AS conversation
  ON conversation."shipmentId" = shipment."id"
 AND conversation."transporterId" = sole_transporter."transporterId"
WHERE message."shipmentId" = shipment."id"
  AND message."senderId" = shipment."shipperId"
  AND message."conversationId" IS NULL;

UPDATE "Conversation" AS conversation
SET "updatedAt" = latest."createdAt"
FROM (
    SELECT "conversationId", MAX("createdAt") AS "createdAt"
    FROM "Message"
    WHERE "conversationId" IS NOT NULL
    GROUP BY "conversationId"
) AS latest
WHERE conversation."id" = latest."conversationId";

ALTER TABLE "Message"
    ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "idx_message_conversation_created"
    ON "Message"("conversationId", "createdAt");
