/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS PostgreSQL integration test. */
// Requires an explicitly supplied local *_test database. Never reads DATABASE_URL.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const loader = require('./test-support/load-ts.cjs');

test('PostgreSQL: payment uniqueness, row locks, rollback, manual approval and checkout snapshots', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost','127.0.0.1','[::1]'].includes(url.hostname) || !/^\/[a-zA-Z0-9_]+_test$/.test(url.pathname)) throw new Error('Use an explicit local database whose name ends in _test.');
  const schema = `payment_test_${randomBytes(8).toString('hex')}`;
  const control = new Pool({ connectionString: url.toString(), connectionTimeoutMillis:5000 });
  let db, pool, created = false;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`); created = true;
    pool = new Pool({ connectionString: url.toString(), options: `-c search_path=${schema}`, connectionTimeoutMillis:5000, max:12 });
    await pool.query(`
      CREATE TYPE "Role" AS ENUM ('USER','ADMIN');
      CREATE TABLE "User" (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT, phone TEXT,
        role "Role" NOT NULL DEFAULT 'USER', "isVIP" BOOLEAN NOT NULL DEFAULT false, "vipExpiresAt" TIMESTAMP(3), "isLocked" BOOLEAN NOT NULL DEFAULT false,
        "dailyFreeLimit" INTEGER NOT NULL DEFAULT 12, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE "VipPlan" (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,price INTEGER NOT NULL,"originalPrice" INTEGER NOT NULL,period TEXT NOT NULL,
        "durationDays" INTEGER,"desc" TEXT NOT NULL,tag TEXT,"isPopular" BOOLEAN NOT NULL DEFAULT false,features TEXT[],"order" INTEGER NOT NULL DEFAULT 0,active BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE "Transaction" (id TEXT PRIMARY KEY,"userId" TEXT NOT NULL REFERENCES "User"(id),amount INTEGER NOT NULL,status TEXT NOT NULL,type TEXT NOT NULL,"sepayId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
    `);
    const upgrade = fs.readFileSync(path.join(__dirname,'../prisma/manual/create_payment_intents.sql'),'utf8');
    await pool.query(upgrade);
    await pool.query(upgrade); // The additive upgrade must also be repeatable.
    await pool.query(fs.readFileSync(path.join(__dirname,"../prisma/manual/create_recovery_audit.sql"),"utf8"));
    await pool.query(fs.readFileSync(path.join(__dirname,"../prisma/migrations/20260918000000_admin_reporting/migration.sql"),"utf8"));
    db = new PrismaClient({ adapter: new PrismaPg(pool,{schema}) });
    const service = loader({'@/lib/prisma':{prisma:db}})('src/lib/payments/service.ts');
    await db.user.create({data:{id:'user',email:'fixture@example.test',password:'fixture-only'}});
    await db.vipPlan.create({data:{id:'month',name:'Month',slug:'month',price:299000,originalPrice:299000,period:'month',durationDays:30,desc:'fixture',features:[]}});
    const config={bankName:'MB',accountNumber:'123456789',accountHolder:'FIXTURE',apiKey:'fixture-webhook-secret',autoActivate:true};
    const intents = await Promise.all(Array.from({length:4},()=>service.createPaymentIntent('user','month',config)));
    assert.equal(new Set(intents.map(i=>i.id)).size,1,'double click must reuse intent under user lock');
    const intent=intents[0];
    await db.vipPlan.update({where:{id:'month'},data:{price:999000,durationDays:365}});
    const event={id:'sepay:1',amount:299000,accountNumber:'123456789',content:intent.paymentCode,transferType:'in'};
    const deliveries=await Promise.all(Array.from({length:8},()=>service.processBankEvent(event,true)));
    assert.equal(deliveries.filter(r=>r.duplicate).length,7);
    let user=await db.user.findUniqueOrThrow({where:{id:'user'}});
    assert.ok((user.vipExpiresAt-Date.now())/86400000 > 29.99 && (user.vipExpiresAt-Date.now())/86400000 <= 30,'saved 30-day snapshot survives plan edit');
    assert.equal(await db.paymentWebhookEvent.count(),1);
    await service.processBankEvent({...event,id:'sepay:2'},true);
    assert.equal((await db.paymentWebhookEvent.findUniqueOrThrow({where:{id:'sepay:2'}})).reason,'ALREADY_PAID');
    const renewal=await service.createPaymentIntent('user','month',config);
    const renewalEvent={...event,id:'sepay:3',amount:renewal.amount,content:renewal.paymentCode};
    await service.processBankEvent(renewalEvent,false);
    await service.approvePaymentIntent(renewal.id,'fixture-admin');
    user=await db.user.findUniqueOrThrow({where:{id:'user'}});
    assert.ok((user.vipExpiresAt-Date.now())/86400000 > 394.99 && (user.vipExpiresAt-Date.now())/86400000 <= 395);
    await assert.rejects(service.cancelUnpaidIntent(renewal.id));
    // Force a real database failure after the user update to verify complete rollback.
    const failing=await service.createPaymentIntent('user','month',config);
    await pool.query(`ALTER TABLE "Transaction" ADD CONSTRAINT reject_fixture CHECK (NOT (id = '${failing.id}' AND status = 'SUCCESS'))`);
    const before=user.vipExpiresAt.getTime();
    await assert.rejects(service.processBankEvent({...event,id:'sepay:4',amount:failing.amount,content:failing.paymentCode},true));
    assert.equal(await db.paymentWebhookEvent.count({where:{id:'sepay:4'}}),0);
    assert.equal((await db.user.findUniqueOrThrow({where:{id:'user'}})).vipExpiresAt.getTime(),before);
    await pool.query('ALTER TABLE "Transaction" DROP CONSTRAINT reject_fixture');
    await service.processBankEvent({...event,id:'sepay:4',amount:failing.amount,content:failing.paymentCode},true);
    assert.equal((await db.transaction.findUniqueOrThrow({where:{id:failing.id}})).status,'SUCCESS');
  } finally {
    if (db) await db.$disconnect();
    if (pool) await pool.end();
    // Only drop the fresh random schema created by this test invocation.
    if (created && /^payment_test_[a-f0-9]{16}$/.test(schema)) await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
});
