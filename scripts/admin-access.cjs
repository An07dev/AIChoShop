/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS operator CLI. */
// Explicit operator tool; never invoked by application startup or seed.
const { loadEnvConfig } = require('@next/env');
const { Pool } = require('pg');
loadEnvConfig(process.cwd());

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email || !email.includes('@') || (flag && flag !== '--grant')) {
    throw new Error('Usage: node scripts/admin-access.cjs <existing-account-email> [--grant]');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis:10000 });
  try {
    const result = await pool.query('SELECT id, role, "isLocked" FROM "User" WHERE lower(email) = lower($1)', [email.trim()]);
    if (result.rows.length !== 1) throw new Error('Expected exactly one existing account; reconcile missing or duplicate emails first.');
    const user = result.rows[0];
    if (user.isLocked) throw new Error('Account is locked; no changes made.');
    // Verify the session table exists before granting access.
    await pool.query('SELECT "tokenHash", "userId", "expiresAt" FROM "SeoSession" LIMIT 0');
    if (!flag) {
      console.log(`Account role: ${user.role}. Read-only check completed; no changes made.`);
      return;
    }
    await pool.query('UPDATE "User" SET role = \'ADMIN\', "updatedAt" = NOW() WHERE id = $1 AND "isLocked" = false', [user.id]);
    console.log('Administrator role granted to the specified existing account. Password unchanged.');
  } finally { await pool.end(); }
}
main().catch(error => { console.error(error.code || error.message); process.exitCode=1; });
