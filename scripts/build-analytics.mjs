import { readFile, writeFile } from 'node:fs/promises';
// Keep the static deployment self-contained without adding a framework or bundler.
const sdk = new URL('../node_modules/@vercel/analytics/dist/index.mjs', import.meta.url);
const source = (await readFile(sdk, 'utf8')).replace(/\n?\/\/# sourceMappingURL=.*$/m, '');
const assignment = '  script.src = src;';
if (source.split(assignment).length !== 2) throw new Error('Review analytics script URL handling after the SDK update');
const code = source.replace(assignment, `  script.src = analyticsScriptURL(src);`);
const policy = `// This site only loads the same-origin production analytics script.
let analyticsPolicy;
function analyticsScriptURL(src) {
  if (src !== '/_vercel/insights/script.js') throw new TypeError('Unexpected analytics script URL');
  if (!globalThis.trustedTypes) return src;
  analyticsPolicy ??= globalThis.trustedTypes.createPolicy('robotechs-analytics', {
    createScriptURL(value) {
      if (value !== '/_vercel/insights/script.js') throw new TypeError('Unexpected analytics script URL');
      return value;
    }
  });
  return analyticsPolicy.createScriptURL(src);
}
`;
await writeFile(new URL('../vercel-analytics.mjs', import.meta.url), policy + code);
console.log('Prepared @vercel/analytics for the static website.');
