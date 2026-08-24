require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

const migrations = [
  // Add isFlagged and flagReason to listings
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS flag_reason TEXT`,
  // Add flagCount and isHidden to reviews
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE`,
  // Create blocked_agents table
  `CREATE TABLE IF NOT EXISTS blocked_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, agent_id)
  )`,
  // Create review_flags table
  `CREATE TABLE IF NOT EXISTS review_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(review_id, user_id)
  )`,
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  for (const sql of migrations) {
    try {
      await client.query(sql);
      console.log('OK:', sql.substring(0, 60));
    } catch (e) {
      if (e.code === '42701' || e.code === '42P07') console.log('Already exists:', sql.substring(0, 60));
      else console.error('FAIL:', sql.substring(0, 60), e.message);
    }
  }
  await client.end();
}

main().catch(console.error);
