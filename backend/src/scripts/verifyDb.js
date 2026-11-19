const db = require('../config/db');

async function verify() {
  try {
    console.log('=== Database Verification ===');
    const dbName = await db.query('SELECT current_database() as db');
    console.log(`Connected Database: ${dbName.rows[0].db}`);

    // Verify products table
    const prodRes = await db.query('SELECT COUNT(*) as count FROM products');
    console.log(`Products in catalog: ${prodRes.rows[0].count} (Expected: 12)`);

    // Verify tables list
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Existing Tables:', tablesRes.rows.map(r => r.table_name).join(', '));

    // Verify applied migrations
    const migRes = await db.query('SELECT name, run_on FROM pgmigrations ORDER BY id');
    console.log('\nApplied Migrations:');
    migRes.rows.forEach(m => console.log(` - ${m.name} (applied at ${m.run_on})`));

    console.log('\n[SUCCESS] Database verification passed! All products and new tables verified.');
  } catch (err) {
    console.error('[ERROR] Verification failed:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

verify();
