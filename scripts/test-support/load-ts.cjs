/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test helper. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
module.exports = function loader(mocks = {}, globals = {}) {
  const cache=new Map();
  function load(file) {
    const full=path.resolve(__dirname,'../..',file);
    if(cache.has(full)) return cache.get(full);
    const exports={}; cache.set(full,exports);
    const context={ exports,module:{exports},Response,Request,URL,Buffer,Date,TextDecoder,Uint8Array,console,process:{env:{}}, require:name=>{
      if(Object.hasOwn(mocks,name)) return mocks[name];
      if(name.startsWith('node:')) return require(name);
      const local=name.startsWith('@/')?path.resolve(__dirname,'../../src',name.slice(2)):name.startsWith('.')?path.resolve(path.dirname(full),name):null;
      if(local) return load(/\.tsx?$/.test(local)?local:fs.existsSync(local+'.ts')?local+'.ts':local+'.tsx');
      throw new Error('Unmocked dependency: '+name);
    }};
    Object.assign(context, globals);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(full,'utf8'),{fileName:full,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,context,{filename:full});
    return context.module.exports;
  }
  return load;
};
