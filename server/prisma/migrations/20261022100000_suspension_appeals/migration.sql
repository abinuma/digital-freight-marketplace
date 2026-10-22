CREATE TABLE "SuspensionAppeal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuspensionAppeal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_suspension_appeal_created_at"
ON "SuspensionAppeal"("createdAt" DESC);

ALTER TABLE "SuspensionAppeal"
ADD CONSTRAINT "SuspensionAppeal_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
