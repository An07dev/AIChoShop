/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./test-support/load-ts.cjs');
const env = { RESEND_API_KEY:'test-only',RECOVERY_EMAIL_FROM:'support@example.test',APP_URL:'https://shop.example.test',NODE_ENV:'production' };
test('recovery mail uses fixed origin, fragment token, bounded request and idempotency',async()=>{
  let request;
  const mail = loader({}, { process:{env}, AbortSignal, fetch:async(url,init)=>{request={url,init};return new Response('{}');} })('src/lib/auth/recovery-mail.ts');
  await mail.sendRecoveryMail('user@example.test','a'.repeat(64),'request-1');
  assert.equal(request.url,'https://api.resend.com/emails');
  assert.equal(request.init.headers['Idempotency-Key'],'password-reset/request-1');
  const body=JSON.parse(request.init.body);
  assert.match(body.text,/https:\/\/shop.example.test\/reset-password#[a-f0-9]{64}/);
  assert.equal(body.to[0],'user@example.test');
  assert.equal(request.init.redirect,'error');
});
test('unconfigured or unsafe production origins reject without sending',()=>{
  for(const patch of [{RESEND_API_KEY:''},{RECOVERY_EMAIL_FROM:''},{APP_URL:''},{APP_URL:'http://shop.example.test'},{APP_URL:'https://user:pass@shop.example.test'}]){
    const mail=loader({}, {process:{env:{...env,...patch}}})('src/lib/auth/recovery-mail.ts');
    assert.throws(mail.recoveryMailConfig,/NOT_CONFIGURED/);
  }
});
test('provider failure does not expose provider response or credentials',async()=>{
  const mail=loader({}, {process:{env},AbortSignal,fetch:async()=>new Response('sensitive provider error',{status:401})})('src/lib/auth/recovery-mail.ts');
  await assert.rejects(()=>mail.sendRecoveryMail('user@example.test','token','id'),/RECOVERY_EMAIL_DELIVERY_FAILED/);
});
