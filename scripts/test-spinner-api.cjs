// Exercises the real route and OpenAI SDK against an isolated local fake provider.
// Does not access the database, user accounts, or configured AI credentials.
const assert = require('node:assert/strict');
const http = require('node:http');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const originalResolve = Module._resolveFilename;
const originalRequire = Module.prototype.require;
const settings = { isOpenAiActive: true, openaiApiKey: 'test-key', openaiModel: 'test-model', openaiBaseUrl: '' };
Module._resolveFilename = function(request, ...args) { return originalResolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), 'src', request.slice(2)) : request, ...args); };
Module.prototype.require = function(request) { if (request === '@/lib/system-settings') return { getSystemSettings: async () => settings }; return originalRequire.call(this, request); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { POST } = require('../src/app/api/ai/title-spinner/route.ts');
const { EMPTY } = require('../src/lib/spinner/contract.ts');
const titles = ['Áo cotton dáng rộng thoải mái', 'Áo cotton linh hoạt vận động', 'Áo cotton dễ phối đồ hàng ngày', 'Áo cotton mềm mại dễ mặc', 'Áo cotton dành cho phong cách đơn giản', 'Áo cotton phối trang phục linh hoạt', 'Áo cotton thiết kế thoải mái', 'Áo cotton tiện mặc đi chơi', 'Áo cotton nhẹ nhàng khi mặc', 'Áo cotton dáng rộng dễ kết hợp'];
let responseMode = 'ok';
let calls = 0;
let lastBody;
const server = http.createServer(async (req, res) => {
  let text = ''; for await (const chunk of req) text += chunk;
  lastBody = JSON.parse(text); calls++;
  res.setHeader('Content-Type', 'application/json');
  if (responseMode === 'unavailable') { res.statusCode = 503; res.end(JSON.stringify({ error: { message: 'fake failure' } })); return; }
  if (responseMode === 'format' && lastBody.response_format) { res.statusCode = 400; res.end(JSON.stringify({ error: { message: 'response_format not supported' } })); return; }
  const count = Number(lastBody.messages[1].content.match(/đúng (\d+) phiên bản/)[1]);
  const variants = titles.slice(0, count).map(title => ({ title, description: `${title}. Chất cotton, dáng rộng, dễ phối đồ cho nhiều hoàn cảnh.` }));
  if (responseMode === 'partial') variants[count === 1 ? 0 : 2] = { title: 'Áo dáng rộng thoải mái', description: '' };
  if (responseMode === 'resume') variants[0] = { title: titles[2], description: '' };
  res.end(JSON.stringify({ choices: [{ message: { content: responseMode === 'invalid' ? '{}' : JSON.stringify({ variants }) }, finish_reason: 'stop' }] }));
});
const body = { inputs: { ...EMPTY, originalTitle: 'Áo cotton form rộng', keywords: 'cotton' } };
const post = (payload, headers = {}) => POST(new Request('http://localhost/api/ai/title-spinner', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof payload === 'string' ? payload : JSON.stringify(payload) }));
(async () => {
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    settings.openaiBaseUrl = `http://127.0.0.1:${server.address().port}/v1`;
    assert.equal((await post('{}')).status, 400);
    assert.equal((await post('{bad')).status, 400);
    assert.equal((await post('x'.repeat(128001))).status, 413);
    assert.equal((await post(body, { Origin: 'https://other.example' })).status, 403);
    assert.equal(calls, 0);
    for (const mode of ['title', 'description', 'both']) {
      const response = await post({ inputs: { ...body.inputs, mode, count: 10, originalDescription: 'Chất liệu cotton. Dáng rộng và linh hoạt, dễ phối đồ.' } });
      assert.equal(response.status, 200);
      const result = await response.json(); assert.equal(result.data.length, 10);
      assert.ok(result.data.every(v => mode === 'title' ? !v.description : mode === 'description' ? !v.title : v.title && v.description));
    }
    responseMode = 'partial'; calls = 0;
    const partialResponse = await post(body);
    assert.equal(partialResponse.status, 200);
    const partial = await partialResponse.json();
    assert.equal(partial.partial, true); assert.equal(partial.data.length, 4);
    assert.deepEqual(partial.data.map(v => v.slot), [0, 1, 3, 4]);
    assert.match(partial.warning, /Phiên bản 3:.*“cotton”/);
    assert.ok(lastBody.messages[1].content.includes('đúng 1 phiên bản')); assert.equal(calls, 2);
    responseMode = 'resume'; calls = 0;
    const resumed = await (await post({ ...body, existing: partial.data })).json();
    assert.equal(resumed.data.length, 5); assert.equal(calls, 1);
    assert.deepEqual(resumed.data.filter(v => v.slot !== 2), partial.data);
    responseMode = 'invalid'; calls = 0;
    assert.equal((await post(body)).status, 502); assert.equal(calls, 2);
    responseMode = 'format'; calls = 0;
    assert.equal((await post(body)).status, 200); assert.equal(calls, 2); assert.equal(lastBody.response_format, undefined);
    responseMode = 'unavailable'; calls = 0;
    const failed = await post(body); assert.equal(failed.status, 503); assert.equal(calls, 1);
    assert.ok(!(await failed.text()).includes('test-key'));
    console.log('PASS: real SDK/route, all modes, partial success and resume, targeted repair, malformed/oversized/origin checks, repair limit, format fallback, provider error. No real AI or database used.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})();
