/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const loader = require('./test-support/load-ts.cjs');

test('PostgreSQL recovery: email, single use, expiry, lock, revocation and atomic audit', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost','127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Local test database required');
  const schema = `recovery_test_${randomBytes(8).toString('hex')}`;
  const control = new Pool({ connectionString: url.toString() });
  let db, pool, created = false;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`); created = true;
    pool = new Pool({ connectionString: url.toString(), options: `-c search_path=${schema}`, max: 10 });
    await pool.query(fs.readFileSync('scripts/fixtures/schema.sql','utf8').replaceAll('"public".',`"${schema}".`).replace('CREATE SCHEMA IF NOT EXISTS "public";',''));
    await pool.query('DROP TABLE "PasswordReset", "AdminAuditLog"');
    const migration = fs.readFileSync('prisma/manual/create_recovery_audit.sql','utf8');
    await pool.query(migration); await pool.query(migration);
    db = new PrismaClient({ adapter: new PrismaPg(pool,{schema}) });
    const sent = []; let failDelivery = false;
    const load = loader({ '@/lib/prisma': { prisma: db }, './recovery-mail': {
      recoveryMailConfig: () => ({}),
      sendRecoveryMail: async (email,token,id) => { if(failDelivery) throw new Error('mail unavailable'); sent.push({email,token,id}); },
    } });
    const { requestRecovery, consumeRecovery } = load('src/lib/auth/recovery.ts');
    const { hashPassword, verifyPassword } = load('src/lib/auth/password.ts');
    await db.user.create({ data: { id:'user', email:'user@example.test', password:await hashPassword('old-password') } });
    await requestRecovery('unknown@example.test'); assert.equal(sent.length,0);
    await requestRecovery('user@example.test'); assert.equal(sent.length,1);
    await requestRecovery('user@example.test'); assert.equal(sent.length,1,'one email per minute');
    let request = await db.passwordReset.findUnique({where:{id:sent[0].id}});
    assert.notEqual(request.tokenHash,sent[0].token); assert.equal(request.deliveryStatus,'SENT');
    await db.seoSession.create({data:{tokenHash:'fixture-session',userId:'user',expiresAt:new Date(Date.now()+600000)}});
    const outcomes = await Promise.allSettled([consumeRecovery(sent[0].token,'new-password'),consumeRecovery(sent[0].token,'new-password')]);
    assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);
    assert.equal(await db.seoSession.count(),0);
    assert.equal(await verifyPassword('new-password',(await db.user.findUnique({where:{id:'user'}})).password),true);
    assert.equal(await db.adminAuditLog.count({where:{action:'PASSWORD_RESET_COMPLETED'}}),1);
    for (const scenario of ['expired','locked','changed-password','audit-failure']) {
      await db.passwordReset.updateMany({data:{consumedAt:new Date()}});
      await db.user.update({where:{id:'user'},data:{isLocked:false}});
      await requestRecovery('user@example.test'); const mail = sent.at(-1);
      if(scenario==='expired')await db.passwordReset.update({where:{id:mail.id},data:{expiresAt:new Date(0)}});
      if(scenario==='locked')await db.user.update({where:{id:'user'},data:{isLocked:true}});
      if(scenario==='changed-password')await db.user.update({where:{id:'user'},data:{password:await hashPassword('changed-again')}});
      if(scenario==='audit-failure')await pool.query('ALTER TABLE "AdminAuditLog" ADD CONSTRAINT reject_new_audit CHECK (action <> \'PASSWORD_RESET_COMPLETED\') NOT VALID');
      const before = (await db.user.findUnique({where:{id:'user'}})).password;
      await assert.rejects(()=>consumeRecovery(mail.token,'another-password'));
      assert.equal((await db.user.findUnique({where:{id:'user'}})).password,before);
      if(scenario==='audit-failure')await pool.query('ALTER TABLE "AdminAuditLog" DROP CONSTRAINT reject_new_audit');
    }
    await db.passwordReset.updateMany({data:{consumedAt:new Date()}});
    failDelivery=true;
    await requestRecovery('user@example.test');
    assert.equal(await db.passwordReset.count({where:{deliveryStatus:'FAILED'}}),1);
    assert.equal(JSON.stringify(await db.adminAuditLog.findMany()).includes(sent[0].token),false);
  } finally {
    if(db)await db.$disconnect();if(pool&&!pool.ended)await pool.end();
    if(created)await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
});
