-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BillingStatus" AS ENUM ('PENDING', 'CHARGED', 'WAIVED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."LeadSource" AS ENUM ('LISTING', 'AI_SEARCH', 'SEARCH', 'FEATURED_LISTING', 'DIRECT_AGENT');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'VIEWING_REQUESTED', 'VIEWING_CONFIRMED', 'VIEWED', 'NEGOTIATING', 'RENTED', 'CLOSED', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'RENTED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'VIEWING_REQUEST');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('SUBSCRIPTION', 'LEAD_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PropertyAgentRole" AS ENUM ('AGENT', 'OWNER', 'INFORMANT');

-- CreateEnum
CREATE TYPE "public"."RelationshipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('STUDENT', 'AGENT', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "public"."VerificationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('UNVERIFIED', 'AGENT_VERIFIED', 'PROPERTY_VERIFIED', 'OWNER_VERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "public"."ViewingStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "public"."agent_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT NOT NULL,
    "bio" TEXT,
    "profile_photo_url" TEXT,
    "verification_status" "public"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."amenities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_charges" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 5000,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "charged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "public"."LeadSource" NOT NULL DEFAULT 'LISTING',
    "budget" INTEGER,
    "move_in_date" DATE,
    "requirements" JSONB,
    "lead_charge_amount" INTEGER NOT NULL DEFAULT 5000,
    "billing_status" "public"."BillingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."listing_amenities" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,
    "value" TEXT,

    CONSTRAINT "listing_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."listing_images" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."listings" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rent_amount" INTEGER NOT NULL,
    "rent_period" TEXT NOT NULL DEFAULT 'MONTH',
    "property_type" TEXT NOT NULL,
    "availability_date" DATE,
    "status" "public"."ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "verification_status" "public"."VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message_type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "attachment_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."properties" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_agents" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "relationship_type" "public"."PropertyAgentRole" NOT NULL,
    "status" "public"."RelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."saved_listings" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "university_id" UUID,
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "preferred_area" TEXT,
    "move_in_date" DATE,
    "room_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "plan_name" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."universities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "city" TEXT NOT NULL DEFAULT 'Arusha',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_records" (
    "id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "verification_type" TEXT NOT NULL,
    "status" "public"."VerificationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "evidence" JSONB,
    "notes" TEXT,
    "verified_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."viewing_requests" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_at" TIMESTAMP(3),
    "status" "public"."ViewingStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_user_id_key" ON "public"."agent_profiles"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "amenities_slug_key" ON "public"."amenities"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_lead_id_key" ON "public"."conversations"("lead_id" ASC);

-- CreateIndex
CREATE INDEX "leads_agent_id_status_idx" ON "public"."leads"("agent_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "leads_student_id_created_at_idx" ON "public"."leads"("student_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "listing_amenities_listing_id_amenity_id_key" ON "public"."listing_amenities"("listing_id" ASC, "amenity_id" ASC);

-- CreateIndex
CREATE INDEX "listings_property_id_idx" ON "public"."listings"("property_id" ASC);

-- CreateIndex
CREATE INDEX "listings_status_rent_amount_idx" ON "public"."listings"("status" ASC, "rent_amount" ASC);

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "public"."messages"("conversation_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "properties_area_idx" ON "public"."properties"("area" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "property_agents_property_id_agent_id_key" ON "public"."property_agents"("property_id" ASC, "agent_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "saved_listings_student_id_listing_id_key" ON "public"."saved_listings"("student_id" ASC, "listing_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "public"."student_profiles"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "universities_slug_key" ON "public"."universities"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone" ASC);

-- CreateIndex
CREATE INDEX "verification_records_target_type_status_idx" ON "public"."verification_records"("target_type" ASC, "status" ASC);

-- AddForeignKey
ALTER TABLE "public"."agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_charges" ADD CONSTRAINT "lead_charges_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listing_amenities" ADD CONSTRAINT "listing_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listing_amenities" ADD CONSTRAINT "listing_amenities_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listings" ADD CONSTRAINT "listings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listings" ADD CONSTRAINT "listings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_agents" ADD CONSTRAINT "property_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_agents" ADD CONSTRAINT "property_agents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saved_listings" ADD CONSTRAINT "saved_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saved_listings" ADD CONSTRAINT "saved_listings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."viewing_requests" ADD CONSTRAINT "viewing_requests_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

