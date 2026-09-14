/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const loader = require('./test-support/load-ts.cjs');

test('AI quota: concurrent requests, failures, midnight, zero limit and expired VIP', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Local *_test database required');
  const schema = `ai_test_${randomBytes(8).toString('hex')}`;
  const control = new Pool({ connectionString: url.toString() });
  let db, pool;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    pool = new Pool({ connectionString: url.toString(), options: `-c search_path=${schema}`, max: 12 });
    const sql = fs.readFileSync('scripts/fixtures/schema.sql', 'utf8').replaceAll('"public".', `"${schema}".`).replace('CREATE SCHEMA IF NOT EXISTS "public";', '');
    await pool.query(sql);
    db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
    const quota = loader({ './prisma': { prisma: db } })('src/lib/ai-quota.ts');
    await db.user.create({ data: { id: 'u', email: 'quota@example.test', password: 'fixture', dailyFreeLimit: 1 } });
    const reservations = await Promise.allSettled(Array.from({ length: 5 }, () => quota.reserveAi('u')));
    assert.equal(reservations.filter(r => r.status === 'fulfilled').length, 1);
    const lease = reservations.find(r => r.status === 'fulfilled').value;
    await quota.releaseAi(lease);
    const next = await quota.reserveAi('u');
    const data = { userId: 'u', tool: 'script-writer', output: 'result', model: 'fixture', inputTokens: 1, outputTokens: 1 };
    await assert.rejects(() => quota.completeAi(next, data, async () => { throw new Error('rollback'); }));
    assert.equal(await db.aiUsageLog.count(), 0);
    await quota.completeAi(next, data);
    await assert.rejects(() => quota.completeAi(next, data));
    await assert.rejects(() => quota.reserveAi('u'), /hết 1/);
    await db.aiUsageLog.deleteMany();
    await db.user.update({ where: { id: 'u' }, data: { dailyFreeLimit: 0, isVIP: true, vipExpiresAt: new Date(0) } });
    await assert.rejects(() => quota.reserveAi('u'), /hết 0/);
    await db.user.update({ where: { id: 'u' }, data: { vipExpiresAt: null } });
    await quota.releaseAi(await quota.reserveAi('u'));
    assert.equal(quota.vnDayStart(new Date('2026-09-14T16:59:59Z')).toISOString(), '2026-09-13T17:00:00.000Z');
    assert.equal(quota.vnDayStart(new Date('2026-09-14T17:00:00Z')).toISOString(), '2026-09-14T17:00:00.000Z');
  } finally {
    if (db) await db.$disconnect();
    if (pool && !pool.ended) await pool.end();
    await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
});
