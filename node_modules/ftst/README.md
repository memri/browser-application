
# Fast TypeScript Transpiler

Fast TS transpiler removes types from a typescript file leaving readable javascript. Since generated javascript is line-by-line equivalent to the typescript source this allows to avoid using source maps while debugging.

## Installing

```bash
npm install ftst
```

## Usage

from command line 
```bash
node -r ftst filename.ts
```

## JS API
`transpileModule(code, options, remove)` - analogue of ts function with same name, 

### Input: 

`code` - typescript code

`options` - specified compiler options

`remove` - if set to `true` generated output will be without commented out types

### Output: 
```js
result = { outputText: outputText, diagnostics: diagnostics}
``` 
`outputText` - resulting javascript code
 
`diagnostics` - array with syntax errors 

### Example: 
```js
var ftst = require("ftst/transpiler");
var options = {
    compilerOptions: {
        newLine: "lf",
        downlevelIteration: true,
        suppressExcessPropertyErrors: true,
        module: ftst.ModuleKind.CommonJS,
        removeComments: false,
        target: ftst.ScriptTarget.ES2020,
        noEmitHelpers: true,
        preserveConstEnums: true,
        noImplicitUseStrict: true
    },
    reportDiagnostics: true
};
let source = 'let decimal: number = 6;';

let result = ftst.transpileModule(source, options, true);
```
`transpile(code, options, remove)` - shortcut function for `transpileModule`; returns only js code without diagnostics
## TODO webpack



## Requirements

Since the goal is to keep generated javascript readable, only **Es2019**, **Es2020** and **EsNext** script targets are supported.


## Running the Unit Tests
You need to make some preparations for using tests: 
1. Download latest version of ts sources from https://github.com/microsoft/TypeScript
2. Create directory for typescripts tests, for example `tests`, and copy content of `tests\cases` from ts sources to created dir
3. Use `prepare-tests.js` from CLI: `node test/prepare-tests.js ./tests`
4. Now your ready to use tests.

For main tests: 
```bash
npm test
```
For Es2019 tests: 
```bash
npm test test/test-es2019.js
```