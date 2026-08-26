const { Pool } = require('pg');

async function test() {
  const fs = require('fs');
  const envFile = fs.readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const connStr = envVars.supabase_session_pooler || envVars.supabase_transaction_pooler || envVars.DATABASE_URL;
  if (!connStr) {
    console.error('❌ No database connection string found');
    process.exit(1);
  }

  const masked = connStr.replace(/:[^@]+@/, ':***@');
  console.log(`🔗 Connecting to: ${masked}\n`);

  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    const client = await pool.connect();
    console.log('✅ Database connected!\n');

    // List all tables
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log(`📋 All tables (${tables.rows.length}):`);
    tables.rows.forEach(t => console.log(`   - ${t.tablename}`));

    console.log('\n📊 Row counts:');
    const keyTables = [
      'users', 'agent_profiles', 'student_profiles', 'listings', 'listing_images',
      'leads', 'conversations', 'messages', 'viewing_requests', 'subscriptions',
      'lead_charges', 'saved_listings', 'notifications', 'reports', 'reviews',
      'review_flags', 'blocked_agents', 'saved_searches', 'ai_interactions',
      'payments', 'universities', 'amenities', 'listing_amenities', 'status_views',
      'contact_reveals', 'room_requests', 'room_request_responses', 'property_agents',
      'verification_records', 'agent_statuses', 'listing_videos', 'properties'
    ];
    
    const existing = new Set(tables.rows.map(t => t.tablename));
    
    for (const table of keyTables) {
      if (existing.has(table)) {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ✅ ${table}: ${result.rows[0].count} rows`);
      } else {
        console.log(`   ⚠️ ${table}: MISSING`);
      }
    }

    // Check missing
    const missing = keyTables.filter(t => !existing.has(t));
    if (missing.length > 0) {
      console.log(`\n⚠️ ${missing.length} missing tables - need migration!`);
    } else {
      console.log('\n✅ All expected tables exist!');
    }

    client.release();
  } catch (e) {
    console.error('❌ Database error:', e.message);
  } finally {
    await pool.end();
  }
}

test();
