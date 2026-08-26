const { Pool } = require('pg');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
const envVars = {};
envFile.split('\n').forEach(l => { const m = l.match(/^([^#=]+)=(.*)$/); if (m) envVars[m[1].trim()] = m[2].trim(); });
const pool = new Pool({ connectionString: envVars.supabase_session_pooler, ssl: { rejectUnauthorized: false } });

// All expected columns per table based on the Prisma schema
const schema = {
  users: {
    'last_active_at': 'TIMESTAMPTZ',
  },
  agent_profiles: {
    'last_active_at': 'TIMESTAMPTZ',
    'avg_response_minutes': 'INTEGER',
  },
  listings: {
    'is_featured': 'BOOLEAN NOT NULL DEFAULT false',
    'featured_until': 'TIMESTAMPTZ',
    'is_flagged': 'BOOLEAN NOT NULL DEFAULT false',
    'flag_reason': 'TEXT',
  },
  reviews: {
    'flag_count': 'INTEGER NOT NULL DEFAULT 0',
    'is_hidden': 'BOOLEAN NOT NULL DEFAULT false',
  },
};

async function run() {
  const client = await pool.connect();
  let totalAdded = 0;
  
  for (const [table, columns] of Object.entries(schema)) {
    const cols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = $1",
      [table]
    );
    const existing = new Set(cols.rows.map(r => r.column_name));
    
    for (const [col, type] of Object.entries(columns)) {
      if (!existing.has(col)) {
        try {
          await client.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
          console.log(`✅ Added ${table}.${col}`);
          totalAdded++;
        } catch(e) {
          console.log(`⚠️  ${table}.${col}: ${e.message}`);
        }
      }
    }
  }
  
  // Verify all tables
  const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log(`\n📋 Total tables: ${tables.rows.length}`);
  console.log(`✅ Columns added: ${totalAdded}`);
  
  client.release();
  await pool.end();
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
