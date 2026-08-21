-- Add enums
DO $$ BEGIN
  CREATE TYPE "RoomRequestStatus" AS ENUM ('OPEN', 'SELECTED', 'CLOSED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'SELECTED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- room_requests table
CREATE TABLE IF NOT EXISTS "room_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "area" TEXT,
  "property_type" TEXT,
  "rent_min" INTEGER,
  "rent_max" INTEGER,
  "room_type" TEXT,
  "amenities" TEXT[] DEFAULT '{}',
  "move_in_date" DATE,
  "status" "RoomRequestStatus" NOT NULL DEFAULT 'OPEN',
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "room_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "room_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "room_requests_status_created_at_idx" ON "room_requests"("status", "created_at");
CREATE INDEX IF NOT EXISTS "room_requests_area_idx" ON "room_requests"("area");

-- room_request_responses table
CREATE TABLE IF NOT EXISTS "room_request_responses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "room_request_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "listing_id" UUID,
  "message" TEXT NOT NULL,
  "proposed_rent" INTEGER,
  "status" "ResponseStatus" NOT NULL DEFAULT 'PENDING',
  "selected_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "room_request_responses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "room_request_responses_room_request_id_fkey" FOREIGN KEY ("room_request_id") REFERENCES "room_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "room_request_responses_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "room_request_responses_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "room_request_responses_room_request_id_agent_id_key" UNIQUE ("room_request_id", "agent_id")
);
