/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const loader = require('./test-support/load-ts.cjs');

test('shared auth limits and concurrent admin protection on PostgreSQL', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Local *_test database required');
  const schema = `auth_test_${randomBytes(8).toString('hex')}`;
  const control = new Pool({ connectionString: url.toString() });
  let db, pool, created = false;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    created = true;
    pool = new Pool({ connectionString: url.toString(), options: `-c search_path=${schema}`, max: 12 });
    await pool.query(fs.readFileSync('scripts/fixtures/schema.sql', 'utf8').replaceAll('"public".', `"${schema}".`).replace('CREATE SCHEMA IF NOT EXISTS "public";', ''));
    // Exercise the actual additive SQL twice, including its access restrictions.
    const migration = fs.readFileSync('prisma/manual/create_auth_rate_limit.sql', 'utf8').replaceAll('public.', `"${schema}".`);
    await pool.query(migration);
    await pool.query(migration);
    db = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
    const load = loader({ '@/lib/prisma': { prisma: db } });
    const { limitAuthAttempts } = load('src/lib/auth/rate-limit.ts');
    const results = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => limitAuthAttempts('login', i % 2 ? ' Person@example.test ' : 'person@example.test')));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 10);
    for (const result of results) if (result.status === 'rejected') assert.match(result.reason.message, /quá nhiều lần/);
    assert.equal(await db.authRateLimit.count(), 2);
    assert.equal((await db.authRateLimit.findMany()).some(row => row.id.includes('person@')), false);
    const register = await Promise.allSettled(Array.from({ length: 8 }, () => limitAuthAttempts('register', 'new@example.test')));
    assert.equal(register.filter(result => result.status === 'fulfilled').length, 5);
    for (const result of register) if (result.status === 'rejected') assert.match(result.reason.message, /quá nhiều lần/);
    await db.authRateLimit.create({ data: { id: 'expired', attempts: 5, expiresAt: new Date(0) } });
    await limitAuthAttempts('login', 'another@example.test');
    assert.equal(await db.authRateLimit.findUnique({ where: { id: 'expired' } }), null);
    const { guardAdminAccountChange } = load('src/lib/auth/admin-account.ts');
    for (const id of ['a', 'b']) await db.user.create({ data: { id, email: `${id}@example.test`, password: 'fixture', role: 'ADMIN' } });
    await assert.rejects(() => db.$transaction(tx => guardAdminAccountChange(tx, 'a', 'a')));
    const locks = await Promise.allSettled([['a','b'], ['b','a']].map(([actor, target]) => db.$transaction(async tx => {
      await guardAdminAccountChange(tx, actor, target);
      await tx.user.update({ where: { id: target }, data: { isLocked: true } });
    })));
    assert.equal(locks.filter(result => result.status === 'fulfilled').length, 1);
    assert.match(locks.find(result => result.status === 'rejected').reason.message, /không còn hợp lệ/);
    assert.equal(await db.user.count({ where: { role: 'ADMIN', isLocked: false } }), 1);
  } finally {
    if (db) await db.$disconnect();
    if (pool && !pool.ended) await pool.end();
    if (created) await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
});
