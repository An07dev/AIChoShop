const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const file = path.join(root, 'src', 'lib', 'http', 'origin.ts');
const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

function loadOriginModule(env = {}) {
  const exports = {};
  const module = { exports };
  const context = {
    exports,
    module,
    process: { env: { APP_URL: 'https://aichoshop.com', ...env } },
    URL,
    Request,
  };
  vm.runInNewContext(js, context);
  return module.exports;
}

test('isAllowedOrigin allows same-origin requests', () => {
  const { isAllowedOrigin } = loadOriginModule();
  const req = new Request('https://aichoshop.com/api/upload/video', {
    headers: { origin: 'https://aichoshop.com', 'sec-fetch-site': 'same-origin' }
  });
  assert.equal(isAllowedOrigin(req), true);
});

test('isAllowedOrigin allows requests through reverse proxy (Hostinger)', () => {
  const { isAllowedOrigin } = loadOriginModule();
  // Reverse proxy forwards request to Node at http://127.0.0.1:3000
  const req = new Request('http://127.0.0.1:3000/api/upload/video', {
    headers: {
      origin: 'https://aichoshop.com',
      host: 'aichoshop.com',
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'aichoshop.com',
      'sec-fetch-site': 'same-origin'
    }
  });
  assert.equal(isAllowedOrigin(req), true);
});

test('isAllowedOrigin allows www.aichoshop.com', () => {
  const { isAllowedOrigin } = loadOriginModule();
  const req = new Request('http://127.0.0.1:3000/api/upload/video', {
    headers: {
      origin: 'https://www.aichoshop.com',
      host: 'www.aichoshop.com',
      'sec-fetch-site': 'same-site'
    }
  });
  assert.equal(isAllowedOrigin(req), true);
});

test('isAllowedOrigin allows localhost dev', () => {
  const { isAllowedOrigin } = loadOriginModule();
  const req = new Request('http://localhost:3001/api/upload/video', {
    headers: {
      origin: 'http://localhost:3001',
      'sec-fetch-site': 'same-origin'
    }
  });
  assert.equal(isAllowedOrigin(req), true);
});

test('isAllowedOrigin rejects explicit cross-site requests', () => {
  const { isAllowedOrigin } = loadOriginModule();
  const req = new Request('https://aichoshop.com/api/upload/video', {
    headers: {
      origin: 'https://evil-hacker.com',
      'sec-fetch-site': 'cross-site'
    }
  });
  assert.equal(isAllowedOrigin(req), false);
});

test('isAllowedOrigin rejects unauthorized third-party origin even without sec-fetch-site', () => {
  const { isAllowedOrigin } = loadOriginModule();
  const req = new Request('https://aichoshop.com/api/upload/video', {
    headers: {
      origin: 'https://malicious-site.com',
      host: 'aichoshop.com'
    }
  });
  assert.equal(isAllowedOrigin(req), false);
});
