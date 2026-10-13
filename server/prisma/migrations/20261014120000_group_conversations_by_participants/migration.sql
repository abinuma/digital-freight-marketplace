ALTER TABLE "Conversation" ADD COLUMN "shipperId" UUID;
ALTER TABLE "Message" ADD COLUMN "conversationIdNew" UUID;

UPDATE "Conversation" AS conversation
SET "shipperId" = shipment."shipperId"
FROM "Shipment" AS shipment
WHERE shipment."id" = conversation."shipmentId";

WITH ranked_conversations AS (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "shipperId", "transporterId"
            ORDER BY "createdAt", "id"
        ) AS "canonicalId",
        MAX("updatedAt") OVER (
            PARTITION BY "shipperId", "transporterId"
        ) AS "latestUpdatedAt"
    FROM "Conversation"
)
UPDATE "Message" AS message
SET "conversationIdNew" = ranked."canonicalId"
FROM ranked_conversations AS ranked
WHERE message."conversationId" = ranked."id";

UPDATE "Message"
SET "conversationIdNew" = "conversationId"
WHERE "conversationIdNew" IS NULL;

WITH ranked_conversations AS (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "shipperId", "transporterId"
            ORDER BY "createdAt", "id"
        ) AS "canonicalId"
    FROM "Conversation"
)
UPDATE "Notification" AS notification
SET "referenceId" = ranked."canonicalId"
FROM ranked_conversations AS ranked
WHERE notification."type" = 'NEW_MESSAGE'
  AND notification."referenceId" = ranked."id"
  AND ranked."id" <> ranked."canonicalId";

WITH ranked_conversations AS (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "shipperId", "transporterId"
            ORDER BY "createdAt", "id"
        ) AS "canonicalId",
        MAX("updatedAt") OVER (
            PARTITION BY "shipperId", "transporterId"
        ) AS "latestUpdatedAt"
    FROM "Conversation"
)
UPDATE "Conversation" AS conversation
SET "updatedAt" = ranked."latestUpdatedAt"
FROM ranked_conversations AS ranked
WHERE conversation."id" = ranked."canonicalId";

WITH ranked_conversations AS (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "shipperId", "transporterId"
            ORDER BY "createdAt", "id"
        ) AS "canonicalId"
    FROM "Conversation"
)
DELETE FROM "Conversation" AS conversation
USING ranked_conversations AS ranked
WHERE conversation."id" = ranked."id"
  AND ranked."id" <> ranked."canonicalId";

ALTER TABLE "Conversation" ALTER COLUMN "shipperId" SET NOT NULL;
ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_shipperId_fkey"
    FOREIGN KEY ("shipperId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_shipmentId_fkey";
DROP INDEX "idx_conversation_shipment_transporter";
DROP INDEX "idx_conversation_shipment_updated";
ALTER TABLE "Conversation" DROP COLUMN "shipmentId";

ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";
DROP INDEX "idx_message_conversation_created";
ALTER TABLE "Message" DROP COLUMN "conversationId";
ALTER TABLE "Message" RENAME COLUMN "conversationIdNew" TO "conversationId";
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "idx_message_conversation_created" ON "Message"("conversationId", "createdAt");

ALTER TABLE "Message" DROP CONSTRAINT "Message_shipmentId_fkey";
DROP INDEX "idx_message_shipment";
ALTER TABLE "Message" DROP COLUMN "shipmentId";

CREATE UNIQUE INDEX "idx_conversation_shipper_transporter"
    ON "Conversation"("shipperId", "transporterId");
CREATE INDEX "idx_conversation_shipper_updated"
    ON "Conversation"("shipperId", "updatedAt" DESC);
