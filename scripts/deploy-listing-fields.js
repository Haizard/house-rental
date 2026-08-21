require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const url = process.env.DATABASE_URL ?? process.env.supabase_session_pooler;
const c = new Client({ connectionString: url });
const sql = fs.readFileSync('scripts/deploy-listing-fields.sql', 'utf8');
c.connect().then(() => c.query(sql)).then(() => {
  console.log('Migration deployed');
  return c.end();
}).catch(e => { console.error(e.message); c.end(); process.exit(1); });
