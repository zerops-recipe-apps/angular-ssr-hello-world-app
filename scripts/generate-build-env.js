// Generates src/environments/build-env.ts with build-time constants.
// Runs in buildCommands before npx ng build — esbuild inlines the result
// into server.mjs so no separate file deployment is needed.

const { readFileSync, writeFileSync } = require('fs');

const angPkg = JSON.parse(
  readFileSync('./node_modules/@angular/core/package.json', 'utf-8')
);

const content = `// Auto-generated at build time by scripts/generate-build-env.js.
// Do not edit — this file is overwritten on every build.
export const BUILD_ENV = {
  version: '${angPkg.version}',
  buildTime: '${new Date().toISOString()}',
};
`;

writeFileSync('src/environments/build-env.ts', content);
console.log('Build env generated: Angular', angPkg.version);
