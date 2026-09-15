/* eslint-disable @typescript-eslint/no-require-imports */
// Explicit production maintenance command. Never invoked by app startup.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createHash } = require('node:crypto');
const { Client } = require('pg');
require('dotenv').config({ quiet: true });
const docker = 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe';
const container = 'aichoshop-test-20260914';
const root = path.resolve('.data/backups/auth-upgrade-20260915');
const archive = path.join(root, 'public-before.dump');
const sql = fs.readFileSync('prisma/manual/create_auth_rate_limit.sql', 'utf8');
const connectionString = process.env.DATABASE_URL;
const target = new URL(connectionString);
if (target.hostname !== 'aws-0-ap-southeast-1.pooler.supabase.com' || target.pathname !== '/postgres') throw new Error('Unexpected database target');

function command(args, input, outputFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(docker, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = ''; let stdout = '';
    const output = outputFile ? fs.createWriteStream(outputFile, { flags: 'wx' }) : null;
    if (output) child.stdout.pipe(output); else child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.stdin.on('error', () => {});
    if (Buffer.isBuffer(input) || typeof input === 'string') child.stdin.end(input); else child.stdin.end();
    child.on('close', code => {
      const finish = () => code === 0 ? resolve(stdout) : reject(new Error(`Docker command failed (${code}): ${stderr.replaceAll(connectionString, '[REDACTED]').replaceAll(decodeURIComponent(target.password), '[REDACTED]')}`));
      if (output && !output.writableFinished) output.once('finish', finish); else finish();
    });
  });
}
async function main() {
  fs.mkdirSync(root, { recursive: true });
  const db = new Client({ connectionString, connectionTimeoutMillis: 10000 });
  await db.connect();
  try {
    const columns = (await db.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='Transaction' ORDER BY ordinal_position")).rows;
    const tables = (await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name")).rows;
    const counts = {};
    for (const { table_name } of tables) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table_name)) throw new Error('Unexpected table name');
      counts[table_name] = (await db.query(`SELECT COUNT(*)::int AS count FROM public."${table_name}"`)).rows[0].count;
    }
    const version = (await db.query('SHOW server_version')).rows[0].server_version;
    console.log(JSON.stringify({ target: target.hostname, version, columns, counts }));
    if (process.argv[2] === 'backup') {
      if (fs.existsSync(archive)) throw new Error('Backup already exists; inspect before reuse');
      await command(['exec', '-i', container, 'sh', '-c', 'IFS= read -r PGDATABASE; export PGDATABASE; exec pg_dump --dbname="$PGDATABASE" --format=custom --schema=public --no-owner --no-acl'], connectionString + '\n', archive);
      const data = fs.readFileSync(archive);
      if (data.subarray(0, 5).toString() !== 'PGDMP') throw new Error('Invalid backup archive');
      const listing = await command(['exec', '-i', container, 'pg_restore', '--list'], data);
      if (!listing.includes('TABLE DATA public Transaction')) throw new Error('Transaction data missing from backup');
      const restoreDb = 'auth_restore_20260915_test';
      await command(['exec', container, 'createdb', '-U', 'postgres', restoreDb]);
      await command(['exec', container, 'psql', '-U', 'postgres', '-d', restoreDb, '-c', 'DROP SCHEMA public']);
      await command(['exec', '-i', container, 'pg_restore', '-U', 'postgres', '--dbname', restoreDb, '--no-owner', '--no-acl', '--exit-on-error'], data);
      const restored = JSON.parse(await command(['exec', container, 'psql', '-U', 'postgres', '-d', restoreDb, '-Atc', `SELECT json_build_object('User',(SELECT COUNT(*) FROM "User"),'Transaction',(SELECT COUNT(*) FROM "Transaction"),'Lesson',(SELECT COUNT(*) FROM "Lesson"));`]));
      for (const key of Object.keys(restored)) if (Number(restored[key]) !== counts[key]) throw new Error(`Restored count mismatch: ${key}`);
      // Remove the local restored copy of real user data after verifying the backup.
      await command(['exec', container, 'dropdb', '-U', 'postgres', restoreDb]);
      fs.writeFileSync(path.join(root, 'backup-verification.json'), JSON.stringify({ createdAt: new Date().toISOString(), target: target.hostname, version, columns, counts, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), restoreVerified: true, sqlSha256: createHash('sha256').update(sql).digest('hex') }, null, 2));
      console.log('BACKUP_AND_RESTORE_VERIFIED');
    } else if (process.argv[2] === 'apply') {
      const report = JSON.parse(fs.readFileSync(path.join(root, 'backup-verification.json'), 'utf8'));
      if (!report.restoreVerified || report.sqlSha256 !== createHash('sha256').update(sql).digest('hex') || report.sha256 !== createHash('sha256').update(fs.readFileSync(archive)).digest('hex')) throw new Error('Verified backup and SQL required');
      if (Date.now() - new Date(report.createdAt).getTime() > 3600000) throw new Error('Backup is too old');
      await db.query('BEGIN');
      try {
        await db.query("SET LOCAL lock_timeout='10s'; SET LOCAL statement_timeout='60s'; SET LOCAL search_path=public;");
        const role = (await db.query("SELECT rolbypassrls,rolsuper FROM pg_roles WHERE rolname=current_user")).rows[0];
        if (!role.rolbypassrls && !role.rolsuper) throw new Error("Backend role cannot access RLS-protected table");
        await db.query(sql.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, ""));
        const columns = (await db.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2", ["public", "AuthRateLimit"])).rows;
        for (const name of ["id","attempts","expiresAt"]) if (!columns.some(c=>c.column_name===name)) throw new Error("Missing column " + name);
        const rls = (await db.query("SELECT relrowsecurity FROM pg_class WHERE oid=$1::regclass", ["public.\"AuthRateLimit\""])).rows[0].relrowsecurity;
        const grants = (await db.query("SELECT grantee FROM information_schema.role_table_grants WHERE table_schema=$1 AND table_name=$2 AND grantee IN ($3,$4,$5)", ["public","AuthRateLimit","anon","authenticated","PUBLIC"])).rows;
        if (!rls || grants.length) throw new Error("Public permissions not secured");
        const indexes = (await db.query("SELECT indexname FROM pg_indexes WHERE schemaname=$1 AND tablename=$2", ["public","AuthRateLimit"])).rows;
        if (!indexes.some(i=>i.indexname==="AuthRateLimit_expiresAt_idx")) throw new Error("Missing expiry index");
        await db.query("SELECT * FROM public.\"AuthRateLimit\" LIMIT 0");
        await db.query('COMMIT');
        fs.writeFileSync(path.join(root, 'migration-result.json'), JSON.stringify({ appliedAt: new Date().toISOString(), target: target.hostname, columns, indexes, rls: true, publicGrants: false }, null, 2));
        console.log('AUTH_MIGRATION_COMMITTED_AND_VERIFIED');
      } catch (error) { await db.query('ROLLBACK'); throw error; }
    } else throw new Error('Use backup or apply');
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.message.replaceAll(connectionString, '[REDACTED]').replaceAll(decodeURIComponent(target.password), '[REDACTED]')); process.exitCode = 1; });
