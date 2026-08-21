-- Add ContactRequestStatus enum
DO $$ BEGIN
  CREATE TYPE "ContactRequestStatus" AS ENUM ('NONE', 'REQUESTED', 'ACCEPTED', 'DECLINED', 'PAID', 'REVEALED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add contact request columns to conversations
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "contact_request_status" "ContactRequestStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "contact_requested_at" TIMESTAMPTZ;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "contact_revealed_at" TIMESTAMPTZ;

-- Create contact_reveals table
CREATE TABLE IF NOT EXISTS "contact_reveals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "amount" INTEGER NOT NULL DEFAULT 5000,
  "currency" TEXT NOT NULL DEFAULT 'TZS',
  "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "payment_ref" TEXT,
  "revealed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "contact_reveals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contact_reveals_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "contact_reveals_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "contact_reveals_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "contact_reveals_conversation_id_idx" ON "contact_reveals"("conversation_id");
CREATE INDEX IF NOT EXISTS "contact_reveals_agent_id_idx" ON "contact_reveals"("agent_id");
