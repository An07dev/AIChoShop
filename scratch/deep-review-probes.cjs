// Local analysis only: every application dependency is stubbed. No database,
// HTTP request, real credential, or upload is used by these probes.
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const results = [];
const load = (file, mocks = {}) => {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  const context = { exports, module: { exports }, require: name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (['crypto', 'node:crypto', 'path'].includes(name)) return require(name);
    throw new Error(`Unstubbed dependency blocked: ${name}`);
  }, process: { env: {}, cwd: () => 'D:/AIChoShop' }, console: { log() {}, warn() {}, error() {} }, Buffer, URL, Date, Math, Set, Map, Error, JSON };
  vm.runInNewContext(code, context, { filename: file });
  return context.module.exports;
};
const next = { NextResponse: { json: (data, options = {}) => ({ status: options.status || 200, data }) } };
const cookieStore = values => ({ get: key => values[key] ? { value: values[key] } : undefined });
const headers = { get: () => null };
async function probe(name, work) { const evidence = await work(); results.push({ name, confirmed: true, evidence }); }
(async () => {
  await probe('Unauthenticated settings GET returns provider credential', async () => {
    const route = load('src/app/api/settings/openai/route.ts', { 'next/server': next, '@/lib/system-settings': { getSystemSettings: async () => ({ openaiApiKey: 'REVIEW_FAKE_KEY', openaiModel: 'fake' }) } });
    const r = await route.GET(); assert.equal(r.data.apiKey, 'REVIEW_FAKE_KEY'); return { status: r.status, credentialReturned: true };
  });
  await probe('Unauthenticated settings POST reaches mutation', async () => {
    let updated = false;
    const route = load('src/app/api/settings/openai/route.ts', { 'next/server': next, '@/lib/system-settings': { updateSystemSettings: async data => { updated = true; return data; } } });
    const r = await route.POST({ json: async () => ({ model: 'review-model' }) }); assert.ok(updated); return { status: r.status, updated };
  });
  await probe('Unauthenticated VIP-plan POST creates a plan', async () => {
    let created = false;
    const route = load('src/app/api/vip-plans/route.ts', { 'next/server': next, '@/lib/prisma': { prisma: { vipPlan: { findUnique: async () => null, create: async ({ data }) => { created = true; return data; } } } }, '@/lib/vip-plans-server': {} });
    const r = await route.POST({ json: async () => ({ name: 'Review fake plan', price: 1 }) }); assert.ok(created); return { status: r.status, created };
  });
  await probe('Unauthenticated VIP-plan DELETE reaches deletion', async () => {
    let deleted = false;
    const route = load('src/app/api/vip-plans/[id]/route.ts', { 'next/server': next, '@/lib/prisma': { prisma: { vipPlan: { findUnique: async () => ({ name: 'Review fake plan' }), delete: async () => { deleted = true; } } } } });
    const r = await route.DELETE({}, { params: Promise.resolve({ id: 'fake-plan' }) }); assert.ok(deleted); return { status: r.status, deleted };
  });
  await probe('Anonymous VIP-labelled AI request calls provider', async () => {
    let calls = 0;
    class FakeAI { constructor() { this.chat = { completions: { create: async () => { calls++; return { choices: [{ message: { content: 'FAKE OUTPUT' }, finish_reason: 'length' }] }; } } }; } }
    const route = load('src/app/api/ai/route.ts', { 'next/server': next, 'next/headers': { cookies: async () => cookieStore({}) }, openai: FakeAI, '@/lib/system-settings': { getSystemSettings: async () => ({ isOpenAiActive: true, openaiApiKey: 'FAKE', openaiModel: 'fake' }) }, '@/lib/ai-usage': {}, '@/lib/prisma': { prisma: {} }, '@/lib/seo/handler': {} });
    const r = await route.POST({ json: async () => ({ tool: 'video-repurposer', inputs: { video_script: 'Review fixture' } }) });
    assert.equal(calls, 1); assert.equal(r.data.success, true); return { status: r.status, providerCalls: calls, truncatedCompletionAccepted: true };
  });
  await probe('SEO identity accepts legacy user-ID cookie without session', async () => {
    const mod = load('src/lib/seo/usage.ts', { 'next/headers': { cookies: async () => cookieStore({ user_token: 'fake-user-id' }) }, '@/lib/prisma': { prisma: { user: { findUnique: async () => ({ id: 'fake-user-id', isLocked: false }) } } }, './session': { SEO_SESSION_COOKIE: 'seo_session' }, './contract': {}, './usage-policy': {} });
    const identity = await mod.seoIdentity(); assert.equal(identity.anonymous, false); return { sessionProvided: false, authenticatedIdentity: identity.id };
  });
  await probe('Webhook without key accepts 1 VND and wrong destination account', async () => {
    let activated = false, days;
    const user = { id: 'fake-user-id', email: 'fixture@example.invalid', isVIP: false, vipExpiresAt: null };
    const route = load('src/app/api/webhooks/sepay/route.ts', { 'next/server': next, '@/lib/prisma': { prisma: {
      transaction: { findFirst: async () => null, create: async () => ({ id: 'fake-tx' }) },
      user: { findFirst: async () => user, update: async ({ data }) => { activated = data.isVIP; return { ...user, ...data }; } },
    } }, '@/lib/sepay-server': { getSePayConfig: async () => ({ apiKey: '', autoActivate: true, accountNumber: 'expected-account' }), calculateNewVipExpiration: (a,b,d) => { days = d; return null; } }, '@/lib/vip-plans-server': { getActiveVipPlans: async () => [{ price: 299000, durationDays: 30, slug: 'month' }] } });
    const r = await route.POST({ headers, json: async () => ({ id: 'fake-event', transferType: 'in', transferAmount: 1, accountNumber: 'wrong-account', content: 'VIP 0901234567' }) });
    assert.ok(activated); assert.equal(days, 30); return { status: r.status, activated, durationDays: days };
  });
  await probe('Admin password-reset action has no internal authorization', async () => {
    let updated = false;
    const actions = load('src/app/admin/users/actions.ts', { '@/lib/prisma': { prisma: { user: { update: async () => { updated = true; } } } }, 'next/cache': { revalidatePath() {} }, '@/lib/sepay-server': {} });
    const r = await actions.resetPasswordByAdmin('fake-user-id', 'review-fixture-password'); assert.ok(updated); return { success: r.success, mutatedWithoutSessionCheck: updated, limitation: 'Direct action invocation; middleware/framework reachability not simulated' };
  });
  await probe('Upload accepts a file reporting 600 MiB without authentication', async () => {
    let written = false;
    const route = load('src/app/api/upload/video/route.ts', { 'next/server': next, fs: { existsSync: () => true, promises: { writeFile: async () => { written = true; } } } });
    const r = await route.POST({ formData: async () => ({ get: () => ({ name: 'fixture.mp4', size: 600 * 1024 * 1024, arrayBuffer: async () => new ArrayBuffer(0) }) }) });
    assert.ok(written); return { status: r.status, mockedWriteReached: written, realBytesWritten: 0 };
  });
  fs.writeFileSync('scratch/deep-review-probes.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
