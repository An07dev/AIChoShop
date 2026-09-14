const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = process.cwd();
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(path.join(root, 'src')).filter(f => /\.(tsx?|css)$/.test(f));
const inventory = files.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const imports = [], functions = [], effects = [], links = [];
  function visit(node) {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    if (ts.isImportDeclaration(node)) imports.push(node.moduleSpecifier.text);
    if (ts.isFunctionDeclaration(node)) functions.push({ name: node.name?.text || 'default', line });
    if (ts.isCallExpression(node) && /(?:useEffect|useMemo|fetch|checkAccess|setInterval|localStorage\.|sessionStorage\.)/.test(node.expression.getText(source))) {
      effects.push({ line, code: node.getText(source).slice(0, 1000) });
    }
    if (ts.isJsxAttribute(node) && ['href', 'src'].includes(node.name.getText(source)) && node.initializer) links.push({ line, target: node.initializer.getText(source).slice(0, 200) });
    ts.forEachChild(node, visit);
  }
  if (!file.endsWith('.css')) visit(source);
  return { file: path.relative(root, file).replaceAll('\\', '/'), lines: content.split('\n').length, bytes: Buffer.byteLength(content), client: /^['"]use client['"]/m.test(content), imports, functions, effects, links };
});
fs.writeFileSync('scratch/deep-review-inventory.json', JSON.stringify(inventory, null, 2));
console.log(JSON.stringify({ files: inventory.length, lines: inventory.reduce((n,f) => n + f.lines, 0), clientModules: inventory.filter(f => f.client).length }));
