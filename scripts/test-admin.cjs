/* eslint-disable @typescript-eslint/no-require-imports */
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {randomUUID}=require('node:crypto');const {Pool}=require('pg');const {PrismaClient}=require('@prisma/client');const {PrismaPg}=require('@prisma/adapter-pg');const loader=require('./test-support/load-ts.cjs');
test('bounded pagination, Vietnamese day boundaries and invalid reporting ranges',()=>{
 const load=loader({'@/lib/prisma':{prisma:{}}}),{listQuery,pageWindow,dateRange}=load('src/lib/admin/list-query.ts'),{reportPeriod}=load('src/lib/admin/reporting.ts');
 assert.equal(listQuery({page:'-1',size:'1000000',q:' x '}).size,20);assert.equal(listQuery({page:'-1'}).page,1);assert.equal(listQuery({size:'50'}).size,50);assert.equal(listQuery({q:'x'.repeat(500)}).q.length,128);
 assert.deepEqual(JSON.parse(JSON.stringify(pageWindow(11,999,10))),{total:11,page:2,pages:2,size:10,skip:10});assert.equal(pageWindow(0,10,20).page,1);
 assert.equal(dateRange('2026-01-01','2026-01-01').bounds.gte.toISOString(),'2025-12-31T17:00:00.000Z');assert.equal(dateRange('2026-01-01','2026-01-01').bounds.lt.toISOString(),'2026-01-01T17:00:00.000Z');assert.ok(dateRange('2026-02-30','').error);assert.ok(dateRange('2026-02-02','2026-02-01').error);
 assert.throws(()=>reportPeriod('2024-01-01','2026-01-01'));assert.equal(reportPeriod('','',new Date('2026-01-01T18:00:00Z')).to,'2026-01-02');
});
test('VIP validation rejects coercions, invalid prices/durations/slugs/flags; allows lifetime and safe generated slug',()=>{
 const {validateVipPlan}=loader()('src/lib/admin/vip-plan-validation.ts');const good={name:'Gói Tháng',price:99000,originalPrice:199000,features:['Học VIP']};
 assert.equal(validateVipPlan(good).slug,'goi-thang');assert.equal(validateVipPlan({...good,slug:'',durationDays:null}).durationDays,null);
 for(const change of [{price:-1},{price:0},{price:'99000'},{price:NaN},{price:1.5},{originalPrice:1},{durationDays:-1},{durationDays:36501},{slug:'Bad Slug'},{active:'false'},{isPopular:'true'},{features:[{}]},{order:-1},{password:'secret'},{active:false,isPopular:true}])assert.throws(()=>validateVipPlan({...good,...change}));
});
test('admin PostgreSQL: lists, payment snapshots, atomic VIP events and reporting', {skip:!process.env.TEST_DATABASE_URL},async()=>{
 const url=new URL(process.env.TEST_DATABASE_URL);if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw Error('Only local _test database allowed');
 const schema='admin_ext_'+randomUUID().replaceAll('-',''),control=new Pool({connectionString:url.toString()});let pool,db,created=false;
 try{
  await control.query(`CREATE SCHEMA "${schema}"`);created=true;pool=new Pool({connectionString:url.toString(),options:`-c search_path=${schema},public`});
  for(const name of fs.readdirSync('prisma/migrations').filter(name=>/^\d/.test(name)).sort()){const sql=fs.readFileSync(`prisma/migrations/${name}/migration.sql`,'utf8').replaceAll('"public".',`"${schema}".`).replaceAll('public."',`"${schema}"."`).replaceAll('public.%I',`${schema}.%I`).replace('CREATE SCHEMA IF NOT EXISTS "public";','');await pool.query(sql);}
  db=new PrismaClient({adapter:new PrismaPg(pool,{schema})});const load=loader({'react/jsx-runtime':require('react/jsx-runtime'),'react':require('react'),'lucide-react':require('lucide-react'),'next/link':{__esModule:true,default:({href,children,className})=>require('react').createElement('a',{href,className},children)},'next/form':{__esModule:true,default:({action,children,className})=>require('react').createElement('form',{action,className},children)},'@/lib/prisma':{prisma:db},'./prisma':{prisma:db},'@/lib/auth/session':{requireAdmin:async()=>({id:'admin'})},'@/components/admin/UsersManager':{UsersManager:()=>null},'@/components/admin/LessonsManager':{LessonsManager:()=>null},'@/components/admin/CoursesManager':{CoursesManager:()=>null},'@/components/admin/AdminListControls':{AdminListControls:()=>null},'next/cache':{revalidatePath:()=>{}}});
  const plans=load('src/lib/admin/vip-plan-service.ts'),payments=load('src/lib/payments/service.ts'),reporting=load('src/lib/admin/reporting.ts'),audit=load('src/lib/auth/audit.ts');
  await db.user.createMany({data:Array.from({length:35},(_,i)=>({id:'u'+String(i).padStart(2,'0'),email:`member${String(i).padStart(2,'0')}@test.local`,password:'hashed',name:'Member',isVIP:i<15,vipExpiresAt:i===0?new Date(0):null,createdAt:new Date('2025-12-01')}))});
  const plan=await plans.writeVipPlan('admin',null,{name:'Month',slug:'month',price:99000,originalPrice:199000,durationDays:30,features:['VIP'],isPopular:true});
  await assert.rejects(plans.writeVipPlan('admin',null,{name:'Duplicate',slug:'month',price:1}));
  const second=await plans.writeVipPlan('admin',null,{name:'Year',price:199000,originalPrice:199000,durationDays:365,isPopular:true});assert.equal((await db.vipPlan.findUnique({where:{id:plan.id}})).isPopular,false);
  await assert.rejects(plans.writeVipPlan('admin',second.id,{active:false},{field:'active',value:false}));
  const cfg={bankName:'Test',accountNumber:'123456789',accountHolder:'TEST',apiKey:'abcdefghijklmnop',autoActivate:true};
  const intent=await payments.createPaymentIntent('u20',plan.id,cfg);assert.equal(intent.amount,99000);
  await plans.writeVipPlan('admin',plan.id,{price:149000,name:'New name'});assert.equal((await db.transaction.findUnique({where:{id:intent.id}})).amount,99000);assert.equal((await db.transaction.findUnique({where:{id:intent.id}})).planName,'Month');
  await plans.writeVipPlan('admin',plan.id,{active:false});await assert.rejects(payments.createPaymentIntent('u20',plan.id,cfg));await assert.rejects(plans.removeVipPlan('admin',plan.id));
  const event={id:'sepay:fixture',amount:99000,accountNumber:cfg.accountNumber,content:intent.paymentCode,transferType:'in'};assert.equal((await payments.processBankEvent(event,true)).status,'APPLIED');await payments.processBankEvent(event,true);assert.equal(await db.vipGrantEvent.count({where:{transactionId:intent.id}}),1);
  const sandboxIntent=await payments.createPaymentIntent('u23',second.id,cfg);
  await db.transaction.update({where:{id:sandboxIntent.id},data:{isSandbox:true}});
  const sandboxResult=await payments.processBankEvent({id:'sepay:sandbox',amount:sandboxIntent.amount,accountNumber:cfg.accountNumber,content:sandboxIntent.paymentCode,transferType:'in'},true);
  assert.equal(sandboxResult.status,'REVIEW');
  assert.equal((await db.user.findUnique({where:{id:'u23'}})).isVIP,false);
  assert.equal(await db.vipGrantEvent.count({where:{transactionId:sandboxIntent.id}}),0);
  await assert.rejects(payments.approvePaymentIntent(sandboxIntent.id,'admin'));
  await audit.auditedUserUpdate('admin','u21','VIP_CHANGED',{isVIP:true,vipExpiresAt:null});await audit.auditedUserUpdate('admin','u21','VIP_CHANGED',{isVIP:true,vipExpiresAt:null});assert.equal(await db.vipGrantEvent.count({where:{userId:'u21'}}),1);await audit.auditedUserUpdate('admin','u21','VIP_CHANGED',{isVIP:true,vipExpiresAt:new Date(Date.now()+86400000)});await audit.auditedUserUpdate('admin','u21','VIP_CHANGED',{isVIP:false});assert.deepEqual((await db.vipGrantEvent.findMany({where:{userId:'u21'},orderBy:{occurredAt:'asc'}})).map(row=>row.kind),['NEW','RENEWAL','REVOKED']);
  await db.course.create({data:{id:'course',title:'Course',status:'DRAFT'}});await db.lesson.createMany({data:Array.from({length:30},(_,i)=>({id:'lesson'+i,courseId:'course',title:'Lesson '+i,order:i+1,status:i%2?'PUBLISHED':'DRAFT',moduleName:'Phần 1'}))});
  const usersPage=await load('src/app/admin/users/page.tsx').default({searchParams:Promise.resolve({q:'member',vip:'free',size:'10',page:'2',sort:'email'})});const users=usersPage.props.children.props.initialUsers;assert.equal(users.length,10);assert.ok(users.every(row=>!row.isVIP));assert.ok(users.some(row=>row.email.includes('member')));
  const lessonPage=await load('src/app/admin/lessons/page.tsx').default({searchParams:Promise.resolve({courseId:'course',status:'DRAFT',size:'10',page:'999'})});const children=lessonPage.props.children;assert.equal(children[1].props.initialLessons.length,5);assert.ok(children[1].props.initialLessons.every(row=>row.status==='DRAFT'));assert.equal(children[1].props.courses[0].maxOrder,30);
  const tx=(id,data)=>db.transaction.create({data:{id,userId:'u22',amount:100,status:'SUCCESS',type:'UPGRADE_VIP',createdAt:new Date('2025-01-01'),paidAt:new Date('2025-12-31T18:00:00Z'),...data}});
  await tx('paid',{amount:100});await tx('sandbox',{amount:999,isSandbox:true});await tx('pending',{status:'PENDING',paidAt:null,amount:777});await tx('missing',{paidAt:null,amount:666});await tx('refunded',{amount:30,status:'REFUNDED',refundedAt:new Date('2026-01-01T06:00:00Z')});await tx('outside',{amount:888,paidAt:new Date('2026-01-01T17:00:00Z')});await tx('credit',{type:'TOPUP',amount:555});
  const p=reporting.reportPeriod('2026-01-01','2026-01-01'),r=await reporting.getAdminReport(p.start,p.end);assert.equal(r.grossRevenue,130);assert.equal(r.refundAmount,30);assert.equal(r.netRevenue,100);assert.equal(r.paidCount,2);assert.equal(r.daily.length,1);assert.equal(r.daily[0].day,'2026-01-01');assert.equal(r.daily[0].gross,130);assert.equal(r.daily[0].refunds,30);assert.equal(r.unknownPaid,1);assert.equal(r.usersAtEnd,35);assert.equal(r.arpu,100/35);assert.equal(r.cohorts[0].accounts,35);assert.equal(r.cohorts[0].gross,130);assert.equal(r.cohorts[0].payers,1);
  const adminActions=load('src/app/admin/sepay/actions.ts');
  assert.equal((await adminActions.recordRefundAction('paid','2026-01-01T12:00:15')).success,true);
  assert.equal((await adminActions.recordRefundAction('paid','2026-01-01T12:00')).success,false);
  assert.equal((await adminActions.recordRefundAction('pending','2026-01-01T12:00')).success,false);
  assert.equal((await adminActions.recordRefundAction('outside','2099-01-01T12:00')).success,false);
  assert.equal((await adminActions.setTransactionSandboxAction('paid',true)).success,true);
  const adjusted=await reporting.getAdminReport(p.start,p.end);
  const dashboard=await load('src/app/admin/page.tsx').default({searchParams:Promise.resolve({from:'2026-01-01',to:'2026-01-01'})});
  const dashboardHtml=require('react-dom/server').renderToStaticMarkup(dashboard);
  for(const title of ['Bảng Điều Khiển Quản Trị','Người Dùng Mới Đăng Ký','Chuyển Khoản Gần Đây','Lối Tắt Quản Trị','Biểu Đồ Doanh Thu VIP','Phân Bổ Học Viên','Doanh thu theo ngày','ARPU'])assert.ok(dashboardHtml.includes(title),title);
  assert.ok(dashboardHtml.includes('/admin/users?q=member'));
  assert.ok(!dashboardHtml.includes('/admin/users?search='));
  assert.equal(adjusted.grossRevenue,30);assert.equal(adjusted.refundAmount,30);assert.equal(adjusted.netRevenue,0);
  await plans.writeVipPlan('admin',second.id,{active:false});assert.equal((await load('src/lib/vip-plans-server.ts').getActiveVipPlans()).length,0);
 }finally{if(db)await db.$disconnect();if(pool&&!pool.ended)await pool.end();if(created)await control.query(`DROP SCHEMA "${schema}" CASCADE`);await control.end();}
});
