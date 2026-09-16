/* eslint-disable @typescript-eslint/no-require-imports */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {randomUUID}=require('node:crypto');
const {Pool}=require('pg');
const {seed}=require('./data/seed.cjs');

function load(file,mocks) {
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  vm.runInNewContext(output,{exports,require:name=>{if(name in mocks) return mocks[name]; throw Error(`Unexpected import ${name}`);},process,console,Date});
  return exports;
}
test('read helpers never recreate missing settings/plans or persist VIP expiry',async()=>{
  let writes=0;
  const model=new Proxy({findUnique:async()=>null,findMany:async()=>[]},{get:(object,key)=> key in object ? object[key] : ()=>{writes++;throw Error('Write during read');}});
  const mocks={'@/lib/prisma':{prisma:{systemSetting:model,sePayConfig:model,vipPlan:model,user:model}},'@/lib/auth/audit':{audit:()=>{writes++;}},'@/lib/vip-expiration':{isVipActive:user=>user.isVIP && (!user.vipExpiresAt || user.vipExpiresAt>new Date())}};
  const plans=load('src/lib/vip-plans-server.ts',mocks);
  const config=load('src/lib/sepay-server.ts',mocks);
  const settings=load('src/lib/system-settings.ts',mocks);
  assert.equal((await plans.getActiveVipPlans()).length,0);
  assert.equal((await config.getSePayConfig()).autoActivate,false);
  const user={id:'expired',isVIP:true,vipExpiresAt:new Date(0)};
  assert.equal((await config.syncUserVipExpiration(user)).isVIP,false);
  assert.equal(user.isVIP,true);
  await settings.getSystemSettings();
  const broken=load('src/lib/system-settings.ts',{...mocks,'@/lib/prisma':{prisma:{systemSetting:{findUnique:async()=>{throw Error('Expected database failure');}}}}});
  assert.equal((await broken.getSystemSettings()).isOpenAiActive,false);
  assert.equal(writes,0);
});

test('PostgreSQL baseline, upgrade and concurrent seeds preserve real content',{skip:!process.env.TEST_DATABASE_URL},async()=>{
  const url=new URL(process.env.TEST_DATABASE_URL);
  if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test')) throw Error('Local _test database required');
  const schema=`data_${randomUUID().replaceAll('-','')}`;
  const control=new Pool({connectionString:url.toString()});
  let pool;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    pool=new Pool({connectionString:url.toString(),options:`-c search_path=${schema},public`});
    const baseline=fs.readFileSync('prisma/migrations/20260916000000_baseline/migration.sql','utf8').replaceAll('"public".',`"${schema}".`).replace('CREATE SCHEMA IF NOT EXISTS "public";','');
    await pool.query(baseline);
    await pool.query(`INSERT INTO "User" (id,email,password,"isVIP","vipExpiresAt","updatedAt") VALUES ('student','student@local.test','kept',true,'2020-01-01',NOW()); INSERT INTO "Course" (id,title,status,"updatedAt") VALUES ('real','Real course','PUBLISHED',NOW()); INSERT INTO "Lesson" (id,title,"courseId","order","moduleName",status,"updatedAt") VALUES ('real-lesson','Real lesson','real',1,'Phần 7','PUBLISHED',NOW()); INSERT INTO "Progress" (id,"userId","lessonId",completed,"updatedAt") VALUES ('progress','student','real-lesson',true,NOW());`);
    await pool.query(`INSERT INTO "SystemSetting" (id,"openaiModel","isOpenAiActive","updatedAt") VALUES ('default','custom-model',true,NOW()); INSERT INTO "SePayConfig" (id,"accountNumber","autoActivate","updatedAt") VALUES ('default','real-account',true,NOW());`);
    const snapshot=await pool.query(`SELECT row_to_json(l) AS value FROM "Lesson" l WHERE id='real-lesson'`);
    const upgrade=fs.readFileSync('prisma/migrations/20260916010000_safe_bootstrap_defaults/migration.sql','utf8');
    await pool.query(upgrade);
    await pool.query(upgrade);
    await Promise.all([seed(pool),seed(pool),seed(pool,'demo'),seed(pool,'demo')]);
    assert.deepEqual((await pool.query(`SELECT row_to_json(l) AS value FROM "Lesson" l WHERE id='real-lesson'`)).rows,snapshot.rows);
    assert.equal((await pool.query(`SELECT completed FROM "Progress" WHERE id='progress'`)).rows[0].completed,true);
    assert.equal((await pool.query(`SELECT "isVIP" FROM "User" WHERE id='student'`)).rows[0].isVIP,true);
    assert.equal((await pool.query(`SELECT "openaiModel" FROM "SystemSetting" WHERE id='default'`)).rows[0].openaiModel,'custom-model');
    assert.equal((await pool.query(`SELECT "accountNumber" FROM "SePayConfig" WHERE id='default'`)).rows[0].accountNumber,'real-account');
    assert.equal((await pool.query(`SELECT COUNT(*)::int AS n FROM "Course" WHERE title LIKE '[DEMO]%'`)).rows[0].n,1);
    const demo=await pool.query(`SELECT l.status,l."moduleName",l."videoUrl" FROM "Lesson" l JOIN "Course" c ON c.id=l."courseId" WHERE c.title LIKE '[DEMO]%' ORDER BY l."order"`);
    assert.equal(demo.rows.length,2);
    assert.equal(demo.rows[0].moduleName,'Phần 1');
    assert.equal(demo.rows[1].moduleName,'Phần 2');
    assert.ok(demo.rows.every(row=>row.status==='DRAFT'&&row.videoUrl===null));
    await pool.query(`DELETE FROM "SystemSetting" WHERE id='default'; DELETE FROM "SePayConfig" WHERE id='default'`);
    await seed(pool);
    assert.equal((await pool.query(`SELECT "adminPassword","isOpenAiActive" FROM "SystemSetting" WHERE id='default'`)).rows[0].adminPassword,null);
    assert.equal((await pool.query(`SELECT "isOpenAiActive" FROM "SystemSetting" WHERE id='default'`)).rows[0].isOpenAiActive,false);
    assert.equal((await pool.query(`SELECT "autoActivate","accountNumber" FROM "SePayConfig" WHERE id='default'`)).rows[0].autoActivate,false);
    await assert.rejects(pool.query(`UPDATE "Lesson" SET "durationSeconds"=-1 WHERE id='real-lesson'`));
  } finally {
    if(pool) await pool.end();
    await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
});

