/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS verification tool. */
// Supplementary source check; does not replace Next route generation/build checks.
const ts = require('typescript');
const path = require('node:path');
const file = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
if (file.error) throw new Error(ts.flattenDiagnosticMessageText(file.error.messageText,'\n'));
const config = ts.parseJsonConfigFileContent(file.config, ts.sys, process.cwd());
const roots = config.fileNames.filter(name => !name.replaceAll('\\','/').includes('/.next/'));
const program = ts.createProgram(roots,{...config.options,incremental:false,noEmit:true});
const diagnostics = [...config.errors,...ts.getPreEmitDiagnostics(program)];
for(const d of diagnostics) {
  const location = d.file && d.start !== undefined ? `${path.relative(process.cwd(),d.file.fileName)}:${d.file.getLineAndCharacterOfPosition(d.start).line+1}: ` : '';
  console.error(location+ts.flattenDiagnosticMessageText(d.messageText,'\n'));
}
console.log(`Source typecheck: ${diagnostics.length} diagnostics.`);
process.exitCode = diagnostics.length ? 1 : 0;
