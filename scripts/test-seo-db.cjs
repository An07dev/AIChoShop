// Integration test against the configured database. Uses isolated test subjects;
// removes only rows created by this run. Never calls an AI provider.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require('@next/env').loadEnvConfig(process.cwd());
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), 'src', request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
const { reserveSeo, finishSeo } = require('../src/lib/seo/usage.ts');
const { prisma } = require('../src/lib/prisma.ts');
const subject = `test:seo:${randomUUID()}`;
const identity = { id: subject, anonymous: true };
const metrics = { model: 'test', provider: 'test', inputTokens: 10, outputTokens: 20, durationMs: 100 };
(async () => {
  try {
    const concurrent = await Promise.allSettled([reserveSeo(identity), reserveSeo(identity), reserveSeo(identity)]);
    assert.equal(concurrent.filter(r => r.status === 'fulfilled').length, 1);
    assert.ok(concurrent.filter(r => r.status === 'rejected').every(r => r.reason.code === 'IN_PROGRESS'));
    const runId = concurrent.find(r => r.status === 'fulfilled').value;
    assert.equal(await finishSeo(subject, runId, false, metrics, 'INVALID_OUTPUT'), 0);
    const retry = await reserveSeo(identity);
    assert.equal(await finishSeo(subject, retry, true, metrics, null), 1);
    const second = await reserveSeo(identity);
    assert.equal(await finishSeo(subject, second, true, metrics, null), 2);
    await assert.rejects(reserveSeo(identity), error => error.code === 'LOGIN_REQUIRED');
    const loggedIn = await reserveSeo({ ...identity, anonymous: false });
    assert.equal(await finishSeo(subject, loggedIn, true, metrics, null), 3);
    const logs = await prisma.$queryRaw`SELECT "status", "inputTokens" FROM "SeoRun" WHERE "subject" = ${subject}`;
    assert.equal(logs.filter(row => row.status === 'failed').length, 1);
    assert.equal(logs.filter(row => row.status === 'success').length, 3);
    assert.ok(logs.every(row => row.inputTokens === 10));
    console.log('PASS: concurrent requests, failed request refund, two-success quota, authenticated quota, usage logs.');
  } catch (error) {
    console.error('SEO integration failed:', error.code || error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$executeRaw`DELETE FROM "SeoRun" WHERE "subject" = ${subject}`;
    await prisma.$executeRaw`DELETE FROM "SeoUsage" WHERE "id" = ${subject}`;
    await prisma.$disconnect();
  }
})();
