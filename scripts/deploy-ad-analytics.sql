-- ad_placements table
CREATE TABLE IF NOT EXISTS "ad_placements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "location" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "provider" TEXT NOT NULL DEFAULT 'adsense',
  "ad_slot_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ad_placements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ad_placements_key_unique" UNIQUE ("key")
);

-- Seed default placements
INSERT INTO "ad_placements" ("key", "name", "description", "location", "enabled") VALUES
  ('FREE_AGENT_DASHBOARD', 'Free Agent Dashboard', 'Ad between stats and leads', 'agent-dashboard', true),
  ('FREE_AGENT_LISTINGS', 'Free Agent Listings', 'Ad in listings management', 'agent-listings', true),
  ('FREE_AGENT_ANALYTICS', 'Free Agent Analytics', 'Ad in analytics page', 'agent-analytics', true),
  ('PUBLIC_SEARCH', 'Public Search', 'Ad on search pages', 'public-search', true),
  ('PUBLIC_LISTING', 'Public Listing', 'Ad on listing detail pages', 'public-listing', true),
  ('PUBLIC_AREA', 'Area Pages', 'Ad on area pages', 'public-area', true),
  ('PUBLIC_UNIVERSITY', 'University Pages', 'Ad on university pages', 'public-university', true)
ON CONFLICT ("key") DO NOTHING;

-- ad_analytics_daily table
CREATE TABLE IF NOT EXISTS "ad_analytics_daily" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "date" DATE NOT NULL,
  "placement" TEXT NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "estimated_revenue" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "ctr" DECIMAL(5,4) NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ad_analytics_daily_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ad_analytics_daily_date_placement_key" UNIQUE ("date", "placement")
);

CREATE INDEX IF NOT EXISTS "ad_analytics_daily_date_idx" ON "ad_analytics_daily"("date");
CREATE INDEX IF NOT EXISTS "ad_analytics_daily_placement_idx" ON "ad_analytics_daily"("placement");

-- agent_ad_daily table — per-agent ad activity
CREATE TABLE IF NOT EXISTS "agent_ad_daily" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "eligible_ad_sessions" INTEGER NOT NULL DEFAULT 0,
  "ad_impressions" INTEGER NOT NULL DEFAULT 0,
  "estimated_ad_revenue" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "lead_count" INTEGER NOT NULL DEFAULT 0,
  "subscription_status" TEXT NOT NULL DEFAULT 'NONE',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "agent_ad_daily_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agent_ad_daily_agent_id_date_key" UNIQUE ("agent_id", "date")
);

CREATE INDEX IF NOT EXISTS "agent_ad_daily_agent_id_idx" ON "agent_ad_daily"("agent_id");
CREATE INDEX IF NOT EXISTS "agent_ad_daily_date_idx" ON "agent_ad_daily"("date");
