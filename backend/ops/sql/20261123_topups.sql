-- Business Nuggets Top-up bundles, order snapshots and three-month credit lots.
-- Apply on a staging database first using an authorized migration role.
-- Idempotent / non-destructive: never truncate or rename legacy tables.
BEGIN;

CREATE TABLE IF NOT EXISTS "NuggetTopUpBundle" (
  "slug" text PRIMARY KEY,
  "name" text NOT NULL,
  "credits" integer NOT NULL CHECK ("credits" BETWEEN 1 AND 10000),
  "priceCents" integer NOT NULL CHECK ("priceCents" BETWEEN 1 AND 1000000000),
  "currency" text NOT NULL DEFAULT 'USD',
  "validityDays" integer NOT NULL DEFAULT 90 CHECK ("validityDays" BETWEEN 1 AND 3650), -- legacy metadata; credit expiry is fixed at three months
  "active" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT NOW(),
  "updatedAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "NuggetTopUpOrder" (
  "reference" text PRIMARY KEY,
  "userId" integer NOT NULL,
  "bundleSlug" text NOT NULL,
  "credits" integer NOT NULL CHECK ("credits" > 0),
  "amountCents" integer NOT NULL CHECK ("amountCents" > 0),
  "currency" text NOT NULL,
  "validityDays" integer NOT NULL DEFAULT 90 CHECK ("validityDays" > 0), -- legacy snapshot only
  "createdAt" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "NuggetTopUpCreditLot" (
  "id" bigserial PRIMARY KEY,
  "reference" text NOT NULL UNIQUE,
  "userId" integer NOT NULL,
  "bundleSlug" text NOT NULL,
  "totalCredits" integer NOT NULL CHECK ("totalCredits" > 0),
  "remainingCredits" integer NOT NULL CHECK ("remainingCredits" >= 0),
  "purchasedAt" timestamptz NOT NULL,
  "originalExpiresAt" timestamptz NOT NULL -- actual credit expiry: purchasedAt + 3 calendar months
);
CREATE INDEX IF NOT EXISTS "NuggetTopUpCreditLot_user_idx"
ON "NuggetTopUpCreditLot" ("userId", "purchasedAt", "id");
CREATE INDEX IF NOT EXISTS "NuggetTopUpCreditLot_expiry_idx"
ON "NuggetTopUpCreditLot" ("userId", "originalExpiresAt", "purchasedAt", "id");

-- Normalize any pre-release/test lots created under the old indefinite-rollover rule.
UPDATE "NuggetTopUpCreditLot"
SET "originalExpiresAt" = "purchasedAt" + INTERVAL '3 months'
WHERE "originalExpiresAt" IS DISTINCT FROM "purchasedAt" + INTERVAL '3 months';

CREATE TABLE IF NOT EXISTS "NuggetTopUpRedemption" (
  "userId" integer NOT NULL,
  "nuggetId" text NOT NULL,
  "redeemedAt" timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("userId", "nuggetId")
);

COMMIT;
-- The runtime database role needs SELECT/INSERT/UPDATE on the above tables
-- and USAGE/SELECT on "NuggetTopUpCreditLot_id_seq".
-- No new plan prices are seeded automatically: configure bundles in Admin.
