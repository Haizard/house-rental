-- Create StatusType enum for agent statuses
DO $$ BEGIN
  CREATE TYPE "StatusType" AS ENUM ('AVAILABLE', 'NEW_ROOM', 'PRICE_DROP', 'URGENT', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add tier column to agent_profiles (defaults to FREE)
ALTER TABLE "agent_profiles" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'FREE';

-- Add agent_statuses table
CREATE TABLE "agent_statuses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "type" "StatusType" NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "title" TEXT,
    "area" TEXT,
    "property_type" TEXT,
    "rent_amount" INTEGER,
    "image_url" TEXT,
    "linked_listing_id" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_statuses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "agent_statuses_agent_id_created_at_idx" ON "agent_statuses"("agent_id", "created_at");
CREATE INDEX "agent_statuses_expires_at_idx" ON "agent_statuses"("expires_at");

-- Add status_views table
CREATE TABLE "status_views" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status_id" UUID NOT NULL,
    "viewer_id" UUID NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_views_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "status_views_status_id_viewer_id_key" UNIQUE ("status_id", "viewer_id")
);
CREATE INDEX "status_views_status_id_idx" ON "status_views"("status_id");
CREATE INDEX "status_views_viewer_id_idx" ON "status_views"("viewer_id");

-- Add reviews table
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "listing_id" UUID,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- Add payments table
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "agent_id" UUID,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "provider" TEXT,
    "provider_transaction_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Add ai_interactions table
CREATE TABLE "ai_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "type" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "tokens_used" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- Add listing_videos table
CREATE TABLE "listing_videos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_videos_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "agent_statuses" ADD CONSTRAINT "agent_statuses_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "status_views" ADD CONSTRAINT "status_views_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "agent_statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "status_views" ADD CONSTRAINT "status_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "listing_videos" ADD CONSTRAINT "listing_videos_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: listings join to properties for area-based search.
-- Individual indexes exist: listings(status, rent_amount) and properties(area).
