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
const stamp = '20260915';
const root = path.resolve(`.data/backups/pricing-fees-upgrade-${stamp}`);
const archive = path.join(root, 'public-before.dump');
const reportFile = path.join(root, 'backup-verification.json');
const resultFile = path.join(root, 'migration-result.json');
const sql = fs.readFileSync('prisma/manual/guard_pricing_fee_periods.sql', 'utf8');
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const target = new URL(connectionString);
if (target.hostname !== 'aws-0-ap-southeast-1.pooler.supabase.com' || target.pathname !== '/postgres') throw new Error('Unexpected database target');

function redact(value) {
  return String(value).replaceAll(connectionString, '[REDACTED]').replaceAll(decodeURIComponent(target.password), '[REDACTED]');
}

function command(args, input, outputFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(docker, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = ''; let stdout = '';
    const output = outputFile ? fs.createWriteStream(outputFile, { flags: 'wx' }) : null;
    if (output) child.stdout.pipe(output); else child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.stdin.on('error', () => {});
    child.stdin.end(input ?? undefined);
    child.on('close', code => {
      const finish = () => code === 0 ? resolve(stdout) : reject(new Error(`Docker command failed (${code}): ${redact(stderr)}`));
      if (output && !output.writableFinished) output.once('finish', finish); else finish();
    });
  });
}

async function inventory(db) {
  const exists = (await db.query("SELECT to_regclass('public.\"PricingFeeOverride\"') IS NOT NULL AS ok")).rows[0].ok;
  if (!exists) throw new Error('PricingFeeOverride table is missing');
  const counts = (await db.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE active)::int AS active FROM "PricingFeeOverride"')).rows[0];
  const overlaps = (await db.query(`SELECT COUNT(*)::int AS count FROM "PricingFeeOverride" a JOIN "PricingFeeOverride" b
    ON a.id < b.id AND a.active AND b.active AND a.platform=b.platform AND a."shopType"=b."shopType" AND a."categoryId"=b."categoryId"
    AND tsrange(a."effectiveFrom",COALESCE(a."effectiveTo",'infinity'::timestamp),'[]') && tsrange(b."effectiveFrom",COALESCE(b."effectiveTo",'infinity'::timestamp),'[]')`)).rows[0].count;
  return { pricingFeeOverrides: counts, activeOverlaps: overlaps };
}

async function main() {
  fs.mkdirSync(root, { recursive: true });
  const db = new Client({ connectionString, connectionTimeoutMillis: 10000 });
  await db.connect();
  try {
    const before = await inventory(db);
    const version = (await db.query('SHOW server_version')).rows[0].server_version;
    console.log(JSON.stringify({ target: target.hostname, version, before }));
    if (process.argv[2] === 'backup') {
      if (before.activeOverlaps !== 0) throw new Error(`Found ${before.activeOverlaps} active overlapping fee periods`);
      if (fs.existsSync(archive)) throw new Error('Backup already exists; inspect before reuse');
      await command(['exec', '-i', container, 'sh', '-c', 'IFS= read -r PGDATABASE; export PGDATABASE; exec pg_dump --dbname="$PGDATABASE" --format=custom --schema=public --no-owner --no-acl'], connectionString + '\n', archive);
      const data = fs.readFileSync(archive);
      if (data.subarray(0, 5).toString() !== 'PGDMP') throw new Error('Invalid backup archive');
      const listing = await command(['exec', '-i', container, 'pg_restore', '--list'], data);
      if (!listing.includes('TABLE public PricingFeeOverride')) throw new Error('PricingFeeOverride table missing from backup');
      const restoreDb = `pricing_restore_${stamp}_test`;
      try {
        await command(['exec', container, 'createdb', '-U', 'postgres', restoreDb]);
        await command(['exec', container, 'psql', '-U', 'postgres', '-d', restoreDb, '-c', 'DROP SCHEMA public']);
        await command(['exec', '-i', container, 'pg_restore', '-U', 'postgres', '--dbname', restoreDb, '--no-owner', '--no-acl', '--exit-on-error'], data);
        const restored = Number((await command(['exec', container, 'psql', '-U', 'postgres', '-d', restoreDb, '-Atc', 'SELECT COUNT(*) FROM "PricingFeeOverride";'])).trim());
        if (restored !== before.pricingFeeOverrides.total) throw new Error('Restored PricingFeeOverride count mismatch');
      } finally {
        await command(['exec', container, 'dropdb', '--if-exists', '-U', 'postgres', restoreDb]);
      }
      fs.writeFileSync(reportFile, JSON.stringify({ createdAt: new Date().toISOString(), target: target.hostname, version, before,
        bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), restoreVerified: true,
        sqlSha256: createHash('sha256').update(sql).digest('hex') }, null, 2));
      console.log('BACKUP_AND_RESTORE_VERIFIED');
    } else if (process.argv[2] === 'apply') {
      const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      if (!report.restoreVerified || report.sqlSha256 !== createHash('sha256').update(sql).digest('hex') ||
          report.sha256 !== createHash('sha256').update(fs.readFileSync(archive)).digest('hex')) throw new Error('Verified backup and SQL required');
      if (Date.now() - new Date(report.createdAt).getTime() > 3600000) throw new Error('Backup is too old');
      if (before.activeOverlaps !== 0) throw new Error('Active fee periods overlap');
      await db.query("SET lock_timeout='10s'; SET statement_timeout='60s'; SET search_path=public;");
      await db.query(sql);
      const constraints = (await db.query(`SELECT conname, convalidated FROM pg_constraint WHERE conrelid='public."PricingFeeOverride"'::regclass
        AND conname IN ('PricingFeeOverride_valid_values_check','PricingFeeOverride_no_active_overlap_excl') ORDER BY conname`)).rows;
      if (constraints.length !== 2 || constraints.some(row => !row.convalidated)) throw new Error('Pricing fee constraints were not validated');
      const after = await inventory(db);
      fs.writeFileSync(resultFile, JSON.stringify({ appliedAt: new Date().toISOString(), target: target.hostname, before, after, constraints }, null, 2));
      console.log('PRICING_FEE_CONSTRAINTS_COMMITTED_AND_VERIFIED');
    } else throw new Error('Use backup or apply');
  } finally { await db.end(); }
}

main().catch(error => { console.error(redact(error.message)); process.exitCode = 1; });
