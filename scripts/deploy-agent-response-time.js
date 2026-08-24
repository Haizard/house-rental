require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

const migrations = [
  // Add lastActiveAt to users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP`,
  // Add avgResponseMinutes to agent_profiles
  `ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS avg_response_minutes INTEGER`,
  // Add isFeatured and featuredUntil to listings
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP`,
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  for (const sql of migrations) {
    try {
      await client.query(sql);
      console.log('OK:', sql.substring(0, 60));
    } catch (e) {
      if (e.code === '42701') console.log('Already exists:', sql.substring(0, 60));
      else console.error('FAIL:', sql.substring(0, 60), e.message);
    }
  }
  await client.end();
}

main().catch(console.error);
