/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
// Isolated regression tests. All database, cookie and provider I/O is replaced.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');

function fixture({ role = 'ADMIN', locked = false, expired = false, token = 'a'.repeat(64), legacy = false, rateLimitUnavailable = false } = {}) {
  let reads = 0;
  const jar = new Map(legacy ? [['user_token', 'victim'], ['admin_token', 'authenticated']] : token ? [['seo_session', token]] : []);
  const store = { get: key => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key, value) => jar.set(key,value), delete: key => jar.delete(key) };
  const db = { seoSession: { findUnique: async ({where}) => {
    reads++;
    assert.equal(where.tokenHash, crypto.createHash('sha256').update(token).digest('hex'));
    return { expiresAt: new Date(Date.now() + (expired ? -60000 : 60000)), user: { id:'fixture-user', role, isLocked:locked } };
  } } };
  const cache = new Map();
  const mocks = {
    '@/lib/auth/rate-limit': { limitAuthAttempts: async () => { if (rateLimitUnavailable) throw new Error('Rate limit storage unavailable'); }, AuthRateLimitError: class extends Error {} },
    '@/lib/prisma': { prisma: db },
    'next/headers': { cookies: async () => store },
    'next/cache': { revalidatePath() {} },
    'next/server': { NextResponse: { json: (value, init) => Response.json(value, init) } },
    'next/navigation': { redirect: () => { throw new Error('REDIRECT'); } },
    '@/lib/system-settings': {}, '@/lib/vip-plans-server': {}, '@/lib/sepay-server': {},
    '@/lib/pricing/registry': {}, '@/lib/vip-plans': {}, openai: {},
  };
  function load(file) {
    const full = path.resolve(root,file);
    if(cache.has(full)) return cache.get(full);
    const exports = {};
    cache.set(full,exports);
    const context = { exports, module: {exports}, Response, Request, FormData, URL, Buffer, Date, console, process: {env:{},cwd:()=>root}, require: name => {
      if(Object.hasOwn(mocks,name)) return mocks[name];
      if(['node:crypto','crypto','path','node:path'].includes(name)) return require(name);
      if(name==='fs') return {existsSync(){throw new Error('Unexpected filesystem access');}};
      const local = name.startsWith('@/') ? path.join(root,'src',name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(full),name) : null;
      if(local) return load(local.endsWith('.ts')?local:local+'.ts');
      throw new Error('Unmocked dependency '+name);
    } };
    const js=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    vm.runInNewContext(js,context,{filename:full});
    return context.module.exports;
  }
  return {load,db,mocks,store,jar,reads:()=>reads};
}

for(const options of [{legacy:true},{token:null},{token:'malformed'},{role:'USER'},{locked:true},{expired:true}]) {
  test('admin denial: '+JSON.stringify(options),async()=>{
    const f=fixture(options);
    const session=f.load('src/lib/auth/session.ts');
    assert.equal((await session.adminRouteGuard()).status,403);
    await assert.rejects(session.requireAdmin());
    if(options.legacy || options.token===null || options.token==='malformed') assert.equal(f.reads(),0);
  });
}

test('valid role from database grants access; cross-site mutations denied',async()=>{
  const session=fixture().load('src/lib/auth/session.ts');
  assert.equal((await session.requireAdmin()).id,'fixture-user');
  assert.equal(await session.adminRouteGuard(new Request('https://app.test/api',{method:'POST',headers:{origin:'https://app.test'}})),null);
  assert.equal((await session.adminRouteGuard(new Request('https://app.test/api',{method:'POST',headers:{origin:'https://other.test'}}))).status,403);
});
test('database failures never grant access',async()=>{
  const f=fixture(); f.db.seoSession.findUnique=async()=>{throw new Error('offline');};
  await assert.rejects(f.load('src/lib/auth/session.ts').requireAdmin(),/offline/);
});

const routes = [
  ['src/app/api/settings/openai/route.ts',['GET','POST']],
  ['src/app/api/vip-plans/route.ts',['POST']],
  ['src/app/api/vip-plans/[id]/route.ts',['PUT','PATCH','DELETE']],
  ['src/app/api/upload/video/route.ts',['POST']],
];
for(const [file,methods] of routes) for(const method of methods) {
  test(`${method} ${file}: forged legacy cookies rejected before I/O`,async()=>{
    const f=fixture({legacy:true});
    const route=f.load(file);
    const result=await route[method](new Request('https://app.test/api',{method}),{params:Promise.resolve({id:'fixture'})});
    assert.equal(result.status,403);
  });
}
test('private VIP listing rejects guests',async()=>{
  const f=fixture({token:null});
  assert.equal((await f.load('src/app/api/vip-plans/route.ts').GET(new Request('https://app.test/api/vip-plans?all=true'))).status,403);
});
test('admin settings response never contains saved secret',async()=>{
  const f=fixture();
  f.mocks['@/lib/system-settings']={getSystemSettings:async()=>({openaiApiKey:'PRIVATE_FIXTURE_SECRET',openaiModel:'fixture',isOpenAiActive:true})};
  const response=await f.load('src/app/api/settings/openai/route.ts').GET();
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.configured,true);
  assert.equal(JSON.stringify(data).includes('PRIVATE_FIXTURE_SECRET'),false);
  assert.equal('apiKey' in data,false);
  assert.equal('token' in data,false);
});

for(const area of ['users','lessons','settings','sepay','vip-plans','pricing-fees']) {
  test(`all ${area} server actions reject a non-admin before I/O`,async()=>{
    const actions=fixture({role:'USER'}).load(`src/app/admin/${area}/actions.ts`);
    for(const [name,action] of Object.entries(actions)) await assert.rejects(action(),/Không có quyền quản trị/,name);
  });
}
test('scrypt passwords are salted, legacy passwords verify, malformed hashes fail',async()=>{
  const passwords=fixture().load('src/lib/auth/password.ts');
  const a=await passwords.hashPassword('test-password');
  const b=await passwords.hashPassword('test-password');
  assert.notEqual(a,b);
  assert.equal(await passwords.verifyPassword('test-password',a),true);
  assert.equal(await passwords.verifyPassword('wrong-password',a),false);
  const legacy=crypto.createHash('sha256').update('old-password').digest('hex');
  assert.equal(await passwords.verifyPassword('old-password',legacy),true);
  for(const malformed of ['','scrypt-v1$invalid$hash',a+'$extra']) assert.equal(await passwords.verifyPassword('test-password',malformed),false);
  assert.equal(await passwords.verifyPassword('x'.repeat(257),a),false);
});
test('password replacement and session revocation share one transaction',async()=>{
  const f=fixture(); const calls=[];
  f.db.$transaction=async work=>work({user:{updateMany:async args=>{calls.push(['password',args]);return {count:1};}},seoSession:{deleteMany:async args=>calls.push(['revoke',args])}});
  await f.load('src/lib/auth/credentials.ts').replacePassword('fixture-user','next-password','old-hash');
  assert.equal(calls[0][1].where.password,'old-hash');
  assert.equal(calls[0][1].data.password.startsWith('scrypt-v1$'),true);
  assert.equal(calls[1][1].where.userId,'fixture-user');
});
test('session creation stores only token hash and refuses changed credentials',async()=>{
  const f=fixture();let inserted;
  const tx={$queryRaw:async()=>[{password:'verified-hash',isLocked:false}],seoSession:{deleteMany:async()=>{},create:async({data})=>{inserted=data;}}};
  f.db.$transaction=async work=>work(tx);
  const session=f.load('src/lib/seo/session.ts');
  await session.createSeoSession('fixture-user','verified-hash');
  const token=f.jar.get('seo_session');
  assert.match(token,/^[a-f0-9]{64}$/);
  assert.notEqual(inserted.tokenHash,token);
  assert.equal(inserted.tokenHash,crypto.createHash('sha256').update(token).digest('hex'));
  await assert.rejects(session.createSeoSession('fixture-user','stale-hash'));
});

test('successful legacy login upgrades password and creates a verified session',async()=>{
  const f=fixture({token:null});
  const old=crypto.createHash('sha256').update('legacy-password').digest('hex');
  const account={id:'fixture-user',password:old,isLocked:false};
  let inserted;
  f.db.user={findMany:async()=>[account],updateMany:async({where,data})=>{assert.equal(where.password,old);account.password=data.password;return {count:1};}};
  f.db.$transaction=async work=>work({$queryRaw:async()=>[account],seoSession:{create:async({data})=>{inserted=data;},deleteMany:async()=>{}}});
  const form=new FormData();form.set('email',' Person@Example.test ');form.set('password','legacy-password');
  const result=await f.load('src/app/actions/auth.ts').loginUser(form);
  assert.equal(result.success,true);
  assert.match(account.password,/^scrypt-v1\$/);
  assert.equal(inserted.userId,'fixture-user');
  assert.match(f.jar.get('seo_session'),/^[a-f0-9]{64}$/);
  assert.equal(f.jar.has('user_token'),false);
});
test('wrong password and ambiguous email never create a session',async()=>{
  for(const duplicate of [false,true]) {
    const f=fixture({token:null});
    const account={id:'fixture-user',password:crypto.createHash('sha256').update('correct').digest('hex'),isLocked:false};
    f.db.user={findMany:async()=>duplicate?[account,account]:[account]};
    const form=new FormData();form.set('email','person@example.test');form.set('password',duplicate?'correct':'incorrect');
    assert.equal((await f.load('src/app/actions/auth.ts').loginUser(form)).success,false);
    assert.equal(f.jar.has('seo_session'),false);
  }
});
test('login and registration fail closed when shared rate limit storage is unavailable',async()=>{
  for (const action of ['loginUser', 'registerUser']) {
    const f=fixture({token:null,rateLimitUnavailable:true});
    let userAccess=false;
    f.db.user={findMany:async()=>{userAccess=true;throw new Error('Unexpected lookup');},findFirst:async()=>{userAccess=true;throw new Error('Unexpected lookup');}};
    const form=new FormData();form.set('email','person@example.test');form.set('password','new-password');
    assert.equal((await f.load('src/app/actions/auth.ts')[action](form)).success,false);
    assert.equal(userAccess,false);
    assert.equal(f.jar.has('seo_session'),false);
  }
});
test('registration preserves a configured zero free limit and hashes password',async()=>{
  const f=fixture({token:null});let created;
  f.db.systemSetting={findUnique:async()=>({defaultDailyFreeLimit:0})};
  f.db.user={findFirst:async()=>null,create:async({data})=>{created={id:'fixture-user',isLocked:false,...data};return created;}};
  f.db.$transaction=async work=>work({$queryRaw:async()=>[created],seoSession:{create:async()=>{},deleteMany:async()=>{}}});
  const form=new FormData();form.set('email',' Person@Example.test ');form.set('password','new-password');
  assert.equal((await f.load('src/app/actions/auth.ts').registerUser(form)).success,true);
  assert.equal(created.email,'person@example.test');
  assert.equal(created.dailyFreeLimit,0);
  assert.match(created.password,/^scrypt-v1\$/);
});
test('password compare-and-swap failure prevents session revocation',async()=>{
  const f=fixture();let revoked=false;
  f.db.$transaction=async work=>work({user:{updateMany:async()=>({count:0})},seoSession:{deleteMany:async()=>{revoked=true;}}});
  await assert.rejects(f.load('src/lib/auth/credentials.ts').replacePassword('fixture-user','new-password','stale-hash'));
  assert.equal(revoked,false);
});
