const { loadEnvConfig } = require('@next/env');
const { Pool } = require('pg');
const { readFileSync } = require('node:fs');
const path = require('node:path');
loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
(async () => {
  try {
    await pool.query(readFileSync(path.join(__dirname, '../prisma/manual/create_seo_usage.sql'), 'utf8'));
    console.log('SEO tables ready. Existing data preserved.');
  } catch (error) {
    console.error('SEO setup failed:', error.code || error.name);
    process.exitCode = 1;
  } finally { await pool.end(); }
})();
