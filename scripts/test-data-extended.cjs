/* eslint-disable @typescript-eslint/no-require-imports */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {randomUUID}=require('node:crypto');const {Pool}=require('pg');
const {PrismaPg}=require('@prisma/adapter-pg');const {PrismaClient}=require('@prisma/client');
const loader=require('./test-support/load-ts.cjs');
const load=loader({}, {TextEncoder,ReadableStream});
const policy=load('src/lib/privacy/policy.ts');
test('DB failures are classified and responses never expose query/credentials',async()=>{
 const errors=load('src/lib/db-errors.ts');
 for(const [code,want,status] of [['P1001','DATABASE_UNAVAILABLE',503],['ECONNRESET','DATABASE_UNAVAILABLE',503],['P2022','DATABASE_SCHEMA_MISMATCH',503],['23514','DATA_CONFLICT',409],['P2034','DATA_BUSY',409]]){
  const response=errors.dataErrorResponse({code,message:'postgres://secret; SELECT private'},'test');assert.equal(response.status,status);const body=await response.json();assert.equal(body.code,want);assert.ok(!JSON.stringify(body).includes('secret'));
 }
});
test('account local histories isolate owners, quarantine legacy, expire/cap/version and reject stale writes',()=>{
 const {accountStorage,HISTORY_KEYS}=load('src/lib/history/storage.ts');const map=new Map();const raw={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};let active='A';const notices=[];
 const a=accountStorage(raw,'A',()=>active==='A',m=>notices.push(m));const b=accountStorage(raw,'B',()=>active==='B',m=>notices.push(m));const key=HISTORY_KEYS[0];
 raw.setItem(key,JSON.stringify([{id:'legacy',input:{private:'unknown'}}]));assert.equal(a.getItem(key),'[]');
 const current={id:'a',createdAt:new Date().toISOString(),input:{productName:'A',nested:{email:'a@test.local',imageBase64:'data:image/png;base64,'+'A'.repeat(500)}}};
 a.setItem(key,JSON.stringify([current,{...current,id:'old',createdAt:new Date(Date.now()-91*86400000).toISOString()}]));assert.equal(JSON.parse(a.getItem(key)).length,1);
 assert.ok(![...map.values()].filter(v=>v.includes('version')).join('').includes('a@test.local'));active='B';assert.equal(b.getItem(key),'[]');assert.throws(()=>a.setItem(key,'[]'),/Tài khoản/);b.setItem(key,JSON.stringify([{...current,id:'b'}]));assert.equal(JSON.parse(b.getItem(key))[0].id,'b');active='A';assert.equal(JSON.parse(a.getItem(key))[0].id,'a');
 a.setItem(key,JSON.stringify(Array.from({length:60},(_,i)=>({...current,id:String(i)}))));assert.equal(JSON.parse(a.getItem(key)).length,50);
 assert.throws(()=>a.setItem(key,JSON.stringify(Array.from({length:50},(_,i)=>({...current,id:String(i),input:{description:'sản phẩm '.repeat(2000)}})))),/512/);
 const physical=[...map.keys()].find(k=>k.includes(':A:'));raw.setItem(physical,'{"version":999,"owner":"A","items":[]}');assert.equal(a.getItem(key),'[]');assert.ok(notices.length);
});
test('history serialization strips nested images/secrets/PII and preserves valid JSON',()=>{
 const input={description:'Gọi 0912345678 hoặc me@example.com',snapshot:{input:{imageBase64:'A'.repeat(500),apiKey:'secret',customerName:'PII'}}};
 const result=policy.serializeHistoryInput(input);assert.ok(!result.includes('secret'));assert.ok(!result.includes('me@example.com'));assert.ok(!result.includes('0912345678'));assert.ok(!result.includes('A'.repeat(500)));assert.ok(JSON.parse(result).snapshot);
 assert.doesNotThrow(()=>JSON.parse(policy.serializeHistoryInput({description:'x'.repeat(100000),other:'y'.repeat(100000)})));
});
test('history API binds identity, rejects account changes/spoofed AI logs and reports schema failure',async()=>{
 let user={id:'A',role:'USER'},recorded,statsFor;let fail=false;
 const route=loader({'next/server':{NextResponse:{json:Response.json}},'@/lib/auth/session':{getSessionUser:async()=>{if(fail)throw {code:'P2021',message:'secret'};return user;}},'@/lib/ai-usage':{getAiUsageStats:async id=>{statsFor=id;return {recentActivities:[]};},recordAiUsage:async p=>{recorded=p;return {success:true};}}})('src/app/api/ai/usage/route.ts');
 function request(method,owner,body){const r=new Request('http://localhost:3001/api/ai/usage?userId=B',{method,headers:{origin:'http://localhost:3001',...(owner?{'X-History-Owner':owner}:{}),'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});r.nextUrl=new URL(r.url);return r;}
 assert.equal((await route.GET(request('GET','A'))).status,200);assert.equal(statsFor,'A');assert.equal((await route.GET(request('GET','B'))).status,409);
 assert.equal((await route.POST(request('POST','A',{tool:'koc-planner',userId:'B',input:{snapshot:{}}}))).status,200);assert.equal(recorded.userId,'A');assert.equal(recorded.tool,'koc-calculator');
 assert.equal((await route.POST(request('POST','A',{tool:'script-writer'}))).status,400);assert.equal((await route.POST(request('POST',null,{tool:'tax-calculator'}))).status,409);
 user=null;assert.equal((await route.POST(request('POST','guest',{tool:'tax-calculator'}))).status,401);fail=true;const response=await route.GET(request('GET','A'));assert.equal(response.status,503);assert.equal((await response.json()).code,'DATABASE_SCHEMA_MISMATCH');
});
test('personal data API rejects guests, changed identity, CSRF and bad confirmation; exports only authenticated owner',async()=>{
 let user={id:'A'},erased,fail=false;
 const route=loader({'@/lib/auth/session':{getSessionUser:async()=>user},'@/lib/privacy/service':{eraseOwnHistory:async id=>{erased=id;return 2;},exportOwnData:async function*(id){if(fail)throw {code:'P1001'};yield {kind:'account',id};yield {kind:'complete'};}}},{TextEncoder,ReadableStream})('src/app/api/account/data/route.ts');
 const get=()=>new Request('http://localhost:3001/api/account/data?userId=B',{headers:{'X-History-Owner':'A'}});
 const del=(owner='A',origin='http://localhost:3001',confirmation='XOA LICH SU')=>new Request('http://localhost:3001/api/account/data?userId=B',{method:'DELETE',headers:{'X-History-Owner':owner,origin,'Content-Type':'application/json'},body:JSON.stringify({confirmation,userId:'B'})});
 let response=await route.GET(get());assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');const lines=(await response.text()).trim().split('\n').map(JSON.parse);assert.equal(lines[0].id,'A');assert.equal(lines.at(-1).kind,'complete');
 assert.equal((await route.DELETE(del('B'))).status,409);assert.equal((await route.DELETE(del('A','http://other.test'))).status,403);assert.equal((await route.DELETE(del('A','http://localhost:3001','bad'))).status,400);assert.equal(erased,undefined);
 assert.equal((await route.DELETE(del())).status,200);assert.equal(erased,'A');fail=true;assert.equal((await route.GET(get())).status,503);user=null;assert.equal((await route.GET(new Request('http://localhost:3001/api/account/data'))).status,401);
});
test('PostgreSQL: constraints, RLS, paginated export, erasure/retention preserve quota and unrelated data; EXPLAIN indexes',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const url=new URL(process.env.TEST_DATABASE_URL);if(!['127.0.0.1','localhost'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw Error('Strict local _test database required');
 const schema='data_ext_'+randomUUID().replaceAll('-',''),reader='data_reader_'+randomUUID().replaceAll('-','');const control=new Pool({connectionString:url.toString()});let pool,db,created=false,roleCreated=false;
 try{
  await control.query(`CREATE SCHEMA "${schema}"`);created=true;pool=new Pool({connectionString:url.toString(),options:`-c search_path=${schema},public`});
  function migration(name){return fs.readFileSync(`prisma/migrations/${name}/migration.sql`,'utf8').replaceAll('"public".',`"${schema}".`).replaceAll('public."',`"${schema}"."`).replaceAll('public.%I',`${schema}.%I`).replace('CREATE SCHEMA IF NOT EXISTS "public";','');}
  await pool.query(migration('20260916000000_baseline'));await pool.query(migration('20260916010000_safe_bootstrap_defaults'));
  db=new PrismaClient({adapter:new PrismaPg(pool,{schema})});const modules=loader({'@/lib/prisma':{prisma:db},'./prisma':{prisma:db}},{TextEncoder,ReadableStream});const service=modules('src/lib/privacy/service.ts'),usage=modules('src/lib/ai-usage.ts');
  await pool.query(`INSERT INTO "User" (id,email,password,"updatedAt") SELECT 'u'||g,'u'||g||'@test.local','hashed-secret',NOW() FROM generate_series(1,100) g; INSERT INTO "Course" (id,title,"updatedAt") SELECT 'c'||g,'Course'||g,NOW() FROM generate_series(1,100) g; INSERT INTO "Lesson" (id,"courseId",title,"order","updatedAt") SELECT 'l'||g,'c'||((g%100)+1),'Lesson'||g,(g/100)+1,NOW() FROM generate_series(1,20000) g; INSERT INTO "AiUsageLog" (id,"userId",tool,"toolName",action,"createdAt") SELECT 'bench'||g,'u'||((g%100)+1),'tool'||((g/100)%20),'Benchmark','Benchmark',NOW()-((g%90)||' days')::interval FROM generate_series(1,50000) g; INSERT INTO "SeoRun" (id,subject,status,"createdAt") SELECT 'bench-run'||g,'user:u'||((g%100)+1),'pending',NOW()-((g%600)||' seconds')::interval FROM generate_series(1,30000) g; INSERT INTO "Transaction" (id,"userId",amount,status,type,"updatedAt","createdAt") SELECT 'bench-tx'||g,'u'||((g%100)+1),1000,CASE WHEN g%50=0 THEN 'REVIEW' ELSE 'SUCCESS' END,'UPGRADE_VIP',NOW(),NOW()-((g%90)||' days')::interval FROM generate_series(1,30000) g; ANALYZE;`);
  const queries={history:`SELECT * FROM "AiUsageLog" WHERE "userId"='u2' AND tool='tool5' ORDER BY "createdAt" DESC LIMIT 50`,lessons:`SELECT id,"order" FROM "Lesson" WHERE "courseId"='c2' ORDER BY "order" LIMIT 50`,pending:`SELECT count(*) FROM "SeoRun" WHERE subject='user:u2' AND status='pending' AND "createdAt">NOW()-INTERVAL '150 seconds'`,transactions:`SELECT id FROM "Transaction" WHERE status='REVIEW' ORDER BY "createdAt" DESC LIMIT 50`};
  const plans={};for(const [key,q]of Object.entries(queries))plans[key]={before:(await pool.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+q)).rows[0]['QUERY PLAN'][0]};
  await pool.query(migration('20260917000000_data_constraints_indexes'));await pool.query('ANALYZE');
  for(const [key,q]of Object.entries(queries))plans[key].after=(await pool.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+q)).rows[0]['QUERY PLAN'][0];
  assert.ok(JSON.stringify(plans.history.after).includes('AiUsageLog_userId_tool_createdAt_idx'));assert.ok(JSON.stringify(plans.lessons.after).includes('Lesson_courseId_order_idx'));assert.ok(JSON.stringify(plans.pending.after).includes('SeoRun_subject_status_createdAt_idx'));assert.ok(JSON.stringify(plans.transactions.after).includes('Transaction_status_createdAt_idx'));
  fs.mkdirSync('.data/test-results',{recursive:true});fs.writeFileSync('.data/test-results/data-index-explain.json',JSON.stringify({fixture:{users:100,lessons:20000,history:50000,runs:30000,transactions:30000},plans},null,2));
  await assert.rejects(pool.query(`UPDATE "User" SET "dailyFreeLimit"=-1 WHERE id='u1'`),e=>e.code==='23514');await assert.rejects(pool.query(`UPDATE "Transaction" SET status='INVALID' WHERE id='bench-tx1'`),e=>e.code==='23514');await assert.rejects(pool.query(`UPDATE "Lesson" SET "order"=0 WHERE id='l1'`),e=>e.code==='23514');
  await pool.query(migration('20260917010000_private_data_access'));await pool.query(migration('20260917020000_catalog_access'));await pool.query(migration('20260916020000_payment_access'));
  await control.query(`CREATE ROLE "${reader}"`);roleCreated=true;await pool.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${reader}"; GRANT SELECT ON ALL TABLES IN SCHEMA "${schema}" TO "${reader}"; SET ROLE "${reader}"`);assert.equal((await pool.query(`SELECT count(*)::int AS n FROM "User"`)).rows[0].n,0);assert.equal((await pool.query(`SELECT count(*)::int AS n FROM "AiUsageLog"`)).rows[0].n,0);await pool.query('RESET ROLE');
  const now=new Date();await db.aiUsageLog.createMany({data:Array.from({length:401},(_,i)=>({id:'export-'+String(i).padStart(4,'0'),userId:'u1',tool:i<2?'script-writer':'pricing-calculator',toolName:'Test',action:'Test',input:JSON.stringify({productName:'Product'}),output:'Output',createdAt:now}))});await db.aiUsageLog.create({data:{id:'b-private',userId:'u2',tool:'script-writer',toolName:'B',action:'B-private',input:'{"private":"B-only"}',output:'B-only'}});
  await db.progress.create({data:{userId:'u1',lessonId:'l1',completed:true}});await db.seoSession.create({data:{tokenHash:'expired-token',userId:'u1',expiresAt:new Date(0)}});await db.passwordReset.create({data:{userId:'u1',tokenHash:'expired-reset',passwordVersion:'version',expiresAt:new Date(0)}});
  const statsBefore=await usage.getAiUsageStats('u1');assert.equal(statsBefore.todayCount,2);
  const exported=[];for await(const row of service.exportOwnData('u1'))exported.push(row);assert.equal(exported.filter(r=>r.kind==='history').length,901);assert.ok(!JSON.stringify(exported).includes('B-only'));assert.ok(!JSON.stringify(exported).includes('hashed-secret'));assert.ok(!JSON.stringify(exported).includes('expired-token'));assert.equal(exported.at(-1).kind,'complete');
  const total=await db.aiUsageLog.count();await service.eraseOwnHistory('u1');assert.equal(await db.aiUsageLog.count(),total);assert.equal((await usage.getAiUsageStats('u1')).todayCount,2);assert.equal((await db.aiUsageLog.findUnique({where:{id:'b-private'}})).output,'B-only');assert.equal(await db.progress.count({where:{userId:'u1',completed:true}}),1);assert.equal(await db.transaction.count(),30000);
  await db.aiUsageLog.create({data:{userId:'u2',tool:'script-writer',toolName:'Old',action:'Old PII',output:'old-content',createdAt:new Date(now.getTime()-91*86400000)}});const cleaned=await service.cleanupPrivateContent(now);assert.equal(cleaned.history,1);assert.equal(cleaned.sessions,1);assert.equal(cleaned.resets,1);assert.equal((await db.aiUsageLog.findUnique({where:{id:'b-private'}})).output,'B-only');assert.equal((await service.cleanupPrivateContent(now)).history,0);assert.equal(await db.seoRun.count(),30000);
 }finally{
  if(pool){await pool.query('RESET ROLE').catch(()=>{});}if(db)await db.$disconnect();if(pool&&!pool.ended)await pool.end();if(created)await control.query(`DROP SCHEMA "${schema}" CASCADE`);if(roleCreated)await control.query(`DROP ROLE "${reader}"`);await control.end();
 }
});
