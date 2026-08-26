const { Pool } = require('pg');
const fs = require('fs');

// Read env.local and strip \r
const raw = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
const vars = {};
for (const line of raw.split('\n')) {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) vars[match[1].trim()] = match[2].trim();
}

const connStr = vars['supabase_session_pooler'] || vars['supabase_transaction_pooler'] || vars['DATABASE_URL'];

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // Create push_subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh_key TEXT NOT NULL,
        auth_key TEXT NOT NULL,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, endpoint)
      );
    `);
    console.log('✅ push_subscriptions table created');

    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active
      ON push_subscriptions(user_id, is_active);
    `);
    console.log('✅ Index created');

    // Verify
    const res = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'push_subscriptions' ORDER BY ordinal_position;
    `);
    console.log('Columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
