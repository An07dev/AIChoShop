/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS HTTP smoke test. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.AUTH_TEST_BASE_URL || 'http://127.0.0.1:3127';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('Use a local isolated server.');
const headers={cookie:'user_token=forged-user-id; admin_token=authenticated','content-type':'application/json'};
(async()=>{
  const results=[];
  for(const [method,path] of [['GET','/api/settings/openai'],['POST','/api/settings/openai'],['GET','/api/vip-plans?all=true'],['POST','/api/vip-plans'],['PUT','/api/vip-plans/fake'],['PATCH','/api/vip-plans/fake'],['DELETE','/api/vip-plans/fake'],['POST','/api/upload/video']]) {
    const response=await fetch(base+path,{method,headers,...(method!=='GET'&&{body:'{}'})});
    assert.equal(response.status,403,`${method} ${path}`);
    results.push({method,path,status:response.status});
  }
  const admin=await fetch(base+'/admin',{headers,redirect:'manual'});
  assert.equal(admin.status,307);assert.ok(admin.headers.get('location').endsWith('/admin-login'));
  results.push({method:'GET',path:'/admin',status:admin.status});
  const login=await fetch(base+'/admin-login');
  assert.equal(login.status,200);assert.ok((await login.text()).includes('name="email"'));
  results.push({method:'GET',path:'/admin-login',status:login.status});
  fs.writeFileSync('scratch/auth-http-results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
