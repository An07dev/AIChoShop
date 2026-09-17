/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS regression tests. */
const test=require('node:test');
const assert=require('node:assert/strict');
const loader=require('./test-support/load-ts.cjs');

// Transactional test double: rollback and serialized transactions are modeled.
// Real PostgreSQL row locks/unique constraints are tested by test-payments-db.cjs.
function fixture() {
  let state={grants:[],audits:[],events:[],intents:[{id:'intent',userId:'user',paymentCode:'ACS0123456789ABCDEF',planId:'plan',planName:'Month',amount:299000,durationDays:30,currency:'VND',accountNumber:'123456789',expiresAt:new Date(Date.now()+1800000),status:'PENDING'}],users:[{id:'user',isVIP:false,vipExpiresAt:null,isLocked:false}]};
  let failWrite=false,tail=Promise.resolve();
  const matches=(item,where)=>Object.entries(where).every(([k,v])=>item[k]===v);
  const model=(key)=>({
    findUnique:async({where})=>state[key].find(item=>matches(item,where))||null,
    findUniqueOrThrow:async({where})=>{const item=state[key].find(item=>matches(item,where));if(!item)throw new Error('missing');return item;},
    findMany:async({where})=>state[key].filter(item=>matches(item,where)),
    count:async({where})=>state[key].filter(item=>matches(item,where)).length,
    update:async({where,data})=>{if(key==='intents' && failWrite)throw new Error('injected failure');const item=state[key].find(item=>matches(item,where));if(!item)throw new Error('missing');Object.assign(item,data);return item;},
    createMany:async({data})=>{let count=0;for(const item of data)if(!state[key].some(old=>old.id===item.id)){state[key].push({...item,receivedAt:new Date()});count++;}return {count};},
  });
  const tx={vipGrantEvent:{create:async({data})=>{state.grants.push(data);return data;}},adminAuditLog:{create:async({data})=>{state.audits.push(data);return data;}},paymentWebhookEvent:model('events'),transaction:model('intents'),user:model('users'),$queryRaw:async(strings,id)=>strings.join('').includes('FROM "User"')?state.users.filter(u=>u.id===id):[]};
  const db={...tx,$transaction:work=>{
    const running=tail.then(async()=>{const backup=structuredClone(state);try{return await work(tx);}catch(error){state=backup;throw error;}});
    tail=running.catch(()=>{});return running;
  }};
  const service=loader({'@/lib/prisma':{prisma:db}})('src/lib/payments/service.ts');
  const event={id:'sepay:1',amount:299000,accountNumber:'123456789',content:'ACS0123456789ABCDEF',transferType:'in'};
  return {service,event,state:()=>state,fail:()=>{failWrite=true;}};
}

test('same event replay and concurrent delivery apply one entitlement',async()=>{
  const f=fixture();const results=await Promise.all(Array.from({length:8},()=>f.service.processBankEvent(f.event,true)));
  assert.equal(results.filter(r=>r.duplicate).length,7);
  assert.equal(f.state().events.length,1);
  assert.equal(f.state().intents[0].status,'SUCCESS');
  assert.equal(f.state().users[0].isVIP,true);
  const days=(f.state().users[0].vipExpiresAt-Date.now())/86400000;
  assert.ok(days>29.99 && days<=30);
});
test('two different bank events for one intent never extend VIP twice',async()=>{
  const f=fixture();await Promise.all([f.service.processBankEvent(f.event,true),f.service.processBankEvent({...f.event,id:'sepay:2'},true)]);
  assert.equal(f.state().events.filter(e=>e.status==='APPLIED').length,1);
  assert.equal(f.state().events.find(e=>e.id==='sepay:2').reason,'ALREADY_PAID');
});
for(const patch of [{amount:1},{amount:300000},{accountNumber:'999999999'},{content:'VIP 0901234567'}]) {
  test('mismatched bank event remains review-only: '+JSON.stringify(patch),async()=>{
    const f=fixture();assert.equal((await f.service.processBankEvent({...f.event,...patch},true)).status,'REVIEW');
    assert.equal(f.state().users[0].isVIP,false);
    assert.equal(f.state().events.length,1);
  });
}
test('outgoing bank event is durably ignored',async()=>{
  const f=fixture();assert.equal((await f.service.processBankEvent({...f.event,transferType:'out'},true)).status,'IGNORED');
  assert.equal(f.state().users[0].isVIP,false);
});
test('mid-transaction failure rolls back entitlement and event, allowing retry',async()=>{
  const f=fixture();f.fail();
  await assert.rejects(f.service.processBankEvent(f.event,true),/injected failure/);
  assert.equal(f.state().users[0].isVIP,false);
  assert.equal(f.state().events.length,0);
  assert.equal(f.state().intents[0].status,'PENDING');
});
test('manual approval requires bank evidence and shares the atomic activation path',async()=>{
  const f=fixture();await assert.rejects(f.service.approvePaymentIntent('intent','admin'));
  await f.service.processBankEvent(f.event,false);
  assert.equal(f.state().users[0].isVIP,false);
  await f.service.approvePaymentIntent('intent','admin');
  assert.equal(f.state().users[0].isVIP,true);
  assert.equal(f.state().intents[0].approvedBy,'admin');
  assert.equal(f.state().events[0].approvedBy,'admin');
  await assert.rejects(f.service.approvePaymentIntent('intent','admin'));
});
test('paid intents cannot be cancelled or erased',async()=>{
  const f=fixture();await f.service.processBankEvent(f.event,true);
  await assert.rejects(f.service.cancelUnpaidIntent('intent'));
  assert.equal(f.state().intents.length,1);
});
test('unpaid cancellation preserves a record and late payment requires review',async()=>{
  const f=fixture();await f.service.cancelUnpaidIntent('intent');
  assert.equal(f.state().intents[0].status,'CANCELLED');
  assert.equal((await f.service.processBankEvent(f.event,true)).status,'REVIEW');
  assert.equal(f.state().users[0].isVIP,false);
});
test('event ID cannot be reused for a different payload',async()=>{
  const f=fixture();await f.service.processBankEvent(f.event,true);
  await assert.rejects(f.service.processBankEvent({...f.event,amount:1},true),/EVENT_ID_CONFLICT/);
});

for(const [key,supplied,status] of [['','','503'],['real-fixture-key','','401'],['real-fixture-key','wrong','401']]) {
  test(`webhook authentication rejects ${status} without processing`,async()=>{
    let processed=false;
    const route=loader({'@/lib/sepay-server':{getSePayConfig:async()=>({apiKey:key,autoActivate:true})},'@/lib/payments/service':{processBankEvent:async()=>{processed=true;}}})('src/app/api/webhooks/sepay/route.ts');
    const response=await route.POST(new Request('https://app.test/api/webhooks/sepay',{method:'POST',headers:{authorization:`Apikey ${supplied}`},body:'{}'}));
    assert.equal(response.status,Number(status));assert.equal(processed,false);
  });
}
test('webhook acknowledges durable review, and retries on storage failure',async()=>{
  for(const fail of [false,true]) {
    const route=loader({'@/lib/sepay-server':{getSePayConfig:async()=>({apiKey:'real-fixture-key',autoActivate:true})},'@/lib/payments/service':{processBankEvent:async()=>{if(fail)throw new Error('database offline');return {status:'REVIEW',duplicate:false};}}})('src/app/api/webhooks/sepay/route.ts');
    const response=await route.POST(new Request('https://app.test/api/webhooks/sepay',{method:'POST',headers:{authorization:'Apikey real-fixture-key'},body:JSON.stringify({id:1,transferAmount:1,accountNumber:'123456789',content:'unknown',transferType:'in'})}));
    assert.equal(response.status,fail?503:200);assert.equal((await response.json()).success,!fail);
  }
});
