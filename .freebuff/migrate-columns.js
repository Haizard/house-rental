const { Pool } = require('pg');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
const envVars = {};
envFile.split('\n').forEach(l => { const m = l.match(/^([^#=]+)=(.*)$/); if (m) envVars[m[1].trim()] = m[2].trim(); });
const pool = new Pool({ connectionString: envVars.supabase_session_pooler, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  
  // Check which columns exist on listings
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'listings' ORDER BY ordinal_position");
  const existing = new Set(cols.rows.map(r => r.column_name));
  console.log('Existing listing columns:', [...existing].join(', '));
  console.log('');

  // Columns our Prisma schema expects on listings
  const expected = {
    'is_featured': 'BOOLEAN NOT NULL DEFAULT false',
    'featured_until': 'TIMESTAMPTZ',
    'is_flagged': 'BOOLEAN NOT NULL DEFAULT false',
    'flag_reason': 'TEXT',
    'room_size': 'INTEGER',
    'number_of_rooms': 'INTEGER',
    'furnished': 'BOOLEAN NOT NULL DEFAULT false',
    'floor_level': 'INTEGER',
    "gender_preference": "TEXT NOT NULL DEFAULT 'ANY'",
    'pets_allowed': 'BOOLEAN NOT NULL DEFAULT false',
    'smoking_allowed': 'BOOLEAN NOT NULL DEFAULT false',
    'max_tenants': 'INTEGER',
    'deposit_amount': 'INTEGER',
    'utilities_included': 'BOOLEAN NOT NULL DEFAULT false',
    'lease_duration': 'TEXT',
    "rent_period": "TEXT NOT NULL DEFAULT 'MONTH'",
  };

  for (const [col, type] of Object.entries(expected)) {
    if (!existing.has(col)) {
      try {
        await client.query('ALTER TABLE listings ADD COLUMN ' + col + ' ' + type);
        console.log('✅ Added listings.' + col);
      } catch(e) {
        console.log('⚠️  listings.' + col + ': ' + e.message);
      }
    } else {
      console.log('   Exists: listings.' + col);
    }
  }

  console.log('');
  // Check agent_profiles columns
  const agentCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'agent_profiles' ORDER BY ordinal_position");
  const agentExisting = new Set(agentCols.rows.map(r => r.column_name));
  
  const agentExpected = {
    'last_active_at': 'TIMESTAMPTZ',
    'avg_response_minutes': 'INTEGER',
  };
  
  for (const [col, type] of Object.entries(agentExpected)) {
    if (!agentExisting.has(col)) {
      try {
        await client.query('ALTER TABLE agent_profiles ADD COLUMN ' + col + ' ' + type);
        console.log('✅ Added agent_profiles.' + col);
      } catch(e) {
        console.log('⚠️  agent_profiles.' + col + ': ' + e.message);
      }
    } else {
      console.log('   Exists: agent_profiles.' + col);
    }
  }

  client.release();
  await pool.end();
  console.log('\nDone!');
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
