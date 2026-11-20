import { readFile, writeFile } from 'node:fs/promises';

// Inline shared and homepage rules to avoid a render-blocking stylesheet request.
// Mark sections exclusive to other pages so the homepage does not carry them.
const page = new URL('../index.html', import.meta.url);
const css = (await readFile(new URL('../style.css', import.meta.url), 'utf8'))
  .replace(/^@charset[^;]+;\s*/, '')
  .replace(/\/\* homepage:exclude:start \*\/[\s\S]*?\/\* homepage:exclude:end \*\//g, '');
const font = '@font-face{font-family:Outfit;font-style:normal;font-weight:100 900;font-display:block;src:url(assets/outfit-latin-v15.woff2) format("woff2")}';
const start = '<!-- homepage-styles:start -->';
const end = '<!-- homepage-styles:end -->';
const html = await readFile(page, 'utf8');
if (!html.includes(start) || !html.includes(end) || /<\/style/i.test(css)) throw new Error('Could not embed homepage stylesheet');
const output = html.slice(0, html.indexOf(start) + start.length) + '<style>' + font + '\n' + css + '</style>' + html.slice(html.indexOf(end));
if (output !== html) await writeFile(page, output);
