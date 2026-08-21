require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const url = process.env.DATABASE_URL ?? process.env.supabase_session_pooler;
const c = new Client({ connectionString: url });
const amenities = [
  ['Wi-Fi','wifi','Utilities'],['Water','water','Utilities'],['Electricity','electricity','Utilities'],
  ['Kitchen','kitchen','Features'],['Parking','parking','Features'],
  ['Balcony','balcony','Features'],['Hot Water','hot-water','Features'],['CCTV','cctv','Security'],
  ['Security Guard','security-guard','Security'],['Gate','gate','Security'],
  ['Laundry','laundry','Convenience'],['Shops Nearby','shops-nearby','Convenience'],['Public Transport','public-transport','Convenience'],
  ['Near University','near-university','Location'],['Quiet Area','quiet-area','Location'],['Compound','compound','Location'],
];
c.connect().then(async () => {
  for (const [name, slug, cat] of amenities) {
    await c.query('INSERT INTO amenities (id, name, slug, category) VALUES (gen_random_uuid(), $1, $2, $3) ON CONFLICT (slug) DO NOTHING', [name, slug, cat]);
  }
  const r = await c.query('SELECT count(*) as cnt FROM amenities');
  console.log('Total amenities:', r.rows[0].cnt);
  await c.end();
}).catch(e => { console.error(e.message); c.end(); process.exit(1); });
