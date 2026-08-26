const { Pool } = require('pg');
const { hashSync } = require('bcryptjs');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8').replace(/\r/g, '');
const envVars = {};
envFile.split('\n').forEach(l => { const m = l.match(/^([^#=]+)=(.*)$/); if (m) envVars[m[1].trim()] = m[2].trim(); });
const pool = new Pool({ connectionString: envVars.supabase_session_pooler, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  
  // Reset password for test users
  const newPassword = 'password123';
  const hash = hashSync(newPassword, 12);
  
  const users = [
    'haithamaugment@gmail.com',  // AGENT
    'haithammisape@gmail.com',   // STUDENT
  ];
  
  for (const email of users) {
    const result = await client.query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, first_name, role', [hash, email]);
    if (result.rows.length > 0) {
      const u = result.rows[0];
      console.log(`✅ Reset password for ${u.email} (${u.first_name}, ${u.role}) → "${newPassword}"`);
    }
  }
  
  client.release();
  await pool.end();
  console.log('\nDone! Use email + "password123" to log in.');
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
