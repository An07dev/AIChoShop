/* eslint-disable @typescript-eslint/no-require-imports */
// Explicit maintenance entry point, never called by install/build/get/render.
const { Pool } = require('pg');
const { randomUUID } = require('node:crypto');
require('dotenv').config({ quiet: true });
async function main() {
  if (!process.env.DATABASE_URL) throw Error('Missing DATABASE_URL');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout='10s'; SET LOCAL statement_timeout='120s'");
    const history = await client.query(`UPDATE "AiUsageLog" SET input=NULL, output=NULL, action=$1 WHERE "createdAt" < NOW()-INTERVAL '90 days' AND (input IS NOT NULL OR output IS NOT NULL OR action <> $1)`, ['Nội dung lịch sử đã được xóa']);
    const sessions = await client.query(`DELETE FROM "SeoSession" WHERE "expiresAt" < NOW()`);
    const resets = await client.query(`UPDATE "PasswordReset" SET "tokenHash"=NULL,"passwordVersion"=NULL WHERE "expiresAt" < NOW() AND ("tokenHash" IS NOT NULL OR "passwordVersion" IS NOT NULL)`);
    const rateLimits = await client.query(`DELETE FROM "AuthRateLimit" WHERE "expiresAt" < NOW()-INTERVAL '1 day'`);
    await client.query(`INSERT INTO "AdminAuditLog" (id,"actorId",action,"targetId",details) VALUES ($1,'system','PRIVACY_MAINTENANCE','retention-90-days',$2)`, [randomUUID(), JSON.stringify({ history: history.rowCount, sessions: sessions.rowCount, resets: resets.rowCount, rateLimits: rateLimits.rowCount })]);
    await client.query('COMMIT');
    console.log(JSON.stringify({ history: history.rowCount, sessions: sessions.rowCount, resets: resets.rowCount, rateLimits: rateLimits.rowCount }));
  } catch (error) { await client.query('ROLLBACK'); console.error('privacy_cleanup_failed', { code: error.code || 'UNKNOWN' }); process.exitCode = 1; }
  finally { client.release(); await pool.end(); }
}
main().catch(() => { console.error('privacy_cleanup_unavailable'); process.exitCode=1; });
