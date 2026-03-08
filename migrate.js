// Idempotent database migration.
// Runs in initCommands via: zsc execOnce ${appVersionId} -- node migrate.js
// node_modules/pg is deployed alongside — no bundling needed.

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function migrate() {
  const client = await pool.connect();
  try {
    // Idempotent schema: IF NOT EXISTS prevents errors on re-run.
    // zsc execOnce in initCommands provides an additional guard against
    // concurrent execution across multiple containers.
    await client.query(`
      CREATE TABLE IF NOT EXISTS greetings (
        id      INTEGER PRIMARY KEY,
        message TEXT    NOT NULL
      )
    `);

    // ON CONFLICT DO NOTHING ensures repeated runs are safe.
    await client.query(`
      INSERT INTO greetings (id, message)
      VALUES (1, 'Hello from Zerops!')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('Migration completed successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
