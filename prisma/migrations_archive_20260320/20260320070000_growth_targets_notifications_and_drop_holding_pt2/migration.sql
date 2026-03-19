-- Remove old strategic targets from finance profile.
ALTER TABLE "UserFinanceProfile"
  DROP COLUMN IF EXISTS "holdingCapitalTarget",
  DROP COLUMN IF EXISTS "holdingContributionPct",
  DROP COLUMN IF EXISTS "holdingLaunchDate",
  DROP COLUMN IF EXISTS "pt2BuildCapitalTarget",
  DROP COLUMN IF EXISTS "pt2ContributionPct",
  DROP COLUMN IF EXISTS "pt2LaunchDate";

DO $$ BEGIN
  CREATE TYPE "GrowthTargetKind" AS ENUM ('ACCOUNT_COUNT', 'CAPITAL_POOL', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'FINANCE', 'COLLABORATION', 'SOCIAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "UserGrowthTarget" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "GrowthTargetKind" NOT NULL,
  "title" TEXT NOT NULL,
  "targetValue" DOUBLE PRECISION NOT NULL,
  "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL,
  "note" TEXT,
  "deadline" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserGrowthTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,

  CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserGrowthTarget_userId_kind_idx"
  ON "UserGrowthTarget"("userId", "kind");

CREATE INDEX IF NOT EXISTS "UserNotification_userId_createdAt_idx"
  ON "UserNotification"("userId", "createdAt" DESC);

DO $$ BEGIN
  ALTER TABLE "UserGrowthTarget"
    ADD CONSTRAINT "UserGrowthTarget_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "UserNotification"
    ADD CONSTRAINT "UserNotification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
