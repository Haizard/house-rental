require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

const migrations = [
  `CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    name TEXT,
    area TEXT,
    property_type TEXT,
    min_price INTEGER,
    max_price INTEGER,
    gender TEXT,
    furnished BOOLEAN,
    amenities TEXT[] DEFAULT '{}',
    last_alert_at TIMESTAMP,
    last_alerted_listing_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_saved_searches_student ON saved_searches(student_id)`,
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  for (const sql of migrations) {
    try {
      await client.query(sql);
      console.log('OK:', sql.substring(0, 60));
    } catch (e) {
      if (e.code === '42710' || e.code === '42P07') console.log('Already exists:', sql.substring(0, 60));
      else console.error('FAIL:', sql.substring(0, 60), e.message);
    }
  }
  await client.end();
}

main().catch(console.error);
