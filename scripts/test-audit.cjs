/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./test-support/load-ts.cjs');

function fixture() {
  const logs = []; let fail = false; let value = 0;
  const db = { adminAuditLog: { create: async ({data}) => { if(fail)throw Error('secret database error'); logs.push(data); return data; } },
    $transaction: async work => { const before=value; try{return await work(db);}catch(e){value=before;throw e;} },
    vipPlan: { update: async () => { value++; return {id:'plan',price:120,active:true,apiKey:'secret',name:'private'}; } }
  };
  const load = loader({'@/lib/prisma':{prisma:db},'@/lib/auth/session':{requireAdmin:async()=>({id:'admin'})},'next/cache':{revalidatePath:()=>{}}});
  return {load,logs,db,setFail:()=>{fail=true;},value:()=>value};
}
test('mutation snapshot allowlists safe fields and preserves actor/target',async()=>{
  const f=fixture(); const {auditedWrite}=f.load('src/lib/auth/audit-operations.ts');
  await auditedWrite('admin','VIP_PLAN_UPDATED',tx=>tx.vipPlan.update());
  assert.equal(f.logs[0].actorId,'admin');assert.equal(f.logs[0].targetId,'plan');
  assert.deepEqual(JSON.parse(f.logs[0].details),{active:true,price:120});
  assert.equal(JSON.stringify(f.logs).includes('secret'),false);
});
test('failed audit rolls back a mutation',async()=>{
  const f=fixture(); f.setFail();
  await assert.rejects(()=>f.load('src/lib/auth/audit-operations.ts').auditedWrite('admin','VIP_PLAN_UPDATED',tx=>tx.vipPlan.update()));
  assert.equal(f.value(),0);
});
test('rejected results, HTTP errors and thrown failures log without input/error text',async()=>{
  const f=fixture();const {auditOutcome}=f.load('src/lib/auth/audit-operations.ts');
  await auditOutcome('admin','validation',async()=>({success:false,error:'secret'}));
  await auditOutcome('admin','api',async()=>new Response('secret',{status:400}));
  await assert.rejects(()=>auditOutcome('admin','throw',async()=>{throw Error('secret');}));
  assert.deepEqual(f.logs.map(x=>x.action),['ADMIN_OPERATION_REJECTED','ADMIN_OPERATION_REJECTED','ADMIN_OPERATION_FAILED']);
  assert.equal(JSON.stringify(f.logs).includes('secret'),false);
});
test('actual VIP server action records its mutation',async()=>{
  const f=fixture();const result=await f.load('src/app/admin/vip-plans/actions.ts').toggleVipPlanActive('plan',false);
  assert.equal(result.success,true);assert.equal(f.logs[0].action,'VIP_PLAN_UPDATED');
});
