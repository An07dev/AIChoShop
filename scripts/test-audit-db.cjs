/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const loader = require('./test-support/load-ts.cjs');

test('PostgreSQL audit: actual admin actions, secret exclusion and rollback', {skip:!process.env.TEST_DATABASE_URL}, async()=>{
  const url = new URL(process.env.TEST_DATABASE_URL);
  if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw Error('Local test database required');
  const schema=`audit_test_${randomBytes(8).toString('hex')}`;
  const control=new Pool({connectionString:url.toString()});let pool,db,created=false;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);created=true;
    pool=new Pool({connectionString:url.toString(),options:`-c search_path=${schema}`});
    await pool.query(fs.readFileSync('scripts/fixtures/schema.sql','utf8').replaceAll('"public".',`"${schema}".`).replace('CREATE SCHEMA IF NOT EXISTS "public";',''));
    db=new PrismaClient({adapter:new PrismaPg(pool,{schema})});
    const load=loader({'@/lib/prisma':{prisma:db},'@/lib/auth/session':{requireAdmin:async()=>({id:'admin'})},'next/cache':{revalidatePath:()=>{}},'@supabase/supabase-js':{createClient:()=>{throw Error('Unexpected Supabase access');}}});
    const plans=load('src/app/admin/vip-plans/actions.ts');
    assert.equal((await plans.createVipPlan({name:'Test',slug:'test',price:100,features:[]})).success,true);
    const plan=await db.vipPlan.findUnique({where:{slug:'test'}});
    assert.equal((await plans.toggleVipPlanActive(plan.id,true)).success,true);
    assert.equal((await plans.deleteVipPlan(plan.id)).success,true);
    const lessons=load('src/app/admin/lessons/actions.ts');
    assert.equal((await lessons.createLesson({title:'Test lesson'})).success,true);
    const lesson=await db.lesson.findFirst();
    assert.equal((await lessons.toggleLessonVip(lesson.id,true)).success,true);
    assert.equal((await lessons.deleteLesson(lesson.id)).success,true);
    await load('src/lib/system-settings.ts').updateSystemSettings({openaiApiKey:'private-key',isOpenAiActive:false},'admin');
    await load('src/lib/sepay-server.ts').updateSePayConfig({apiKey:'private-bank-key',accountNumber:'private-account'},'admin');
    const logs=await db.adminAuditLog.findMany();
    for(const action of ['VIP_PLAN_CREATED','VIP_PLAN_UPDATED','VIP_PLAN_DELETED','COURSE_CREATED','LESSON_CREATED','LESSON_UPDATED','LESSON_DELETED','SYSTEM_SETTINGS_UPDATED','BANK_SETTINGS_UPDATED'])assert.ok(logs.some(x=>x.action===action),action);
    assert.equal(JSON.stringify(logs).includes('private-'),false);
    await pool.query('ALTER TABLE "AdminAuditLog" ADD CONSTRAINT audit_reject CHECK (action <> \'SYSTEM_SETTINGS_UPDATED\') NOT VALID');
    await assert.rejects(()=>load('src/lib/system-settings.ts').updateSystemSettings({isOpenAiActive:true},'admin'));
    assert.equal((await db.systemSetting.findUnique({where:{id:'default'}})).isOpenAiActive,false);
  } finally {
    if(db)await db.$disconnect();if(pool&&!pool.ended)await pool.end();
    if(created)await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
});
