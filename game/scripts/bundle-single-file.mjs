/**
 * Inlines the Vite build into one self-contained HTML file, for hosts that
 * only accept a single document (no external CSS or JS requests).
 *
 *   npm run build && node scripts/bundle-single-file.mjs [outfile]
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'dist', 'assets');
const out = process.argv[2] ?? join(root, 'dist', 'glide-arena.html');

const files = readdirSync(assets);
const jsName = files.find((f) => f.endsWith('.js'));
const cssName = files.find((f) => f.endsWith('.css'));
if (!jsName || !cssName) throw new Error('dist/assets is missing the built js/css — run npm run build first');

const js = readFileSync(join(assets, jsName), 'utf8');
const css = readFileSync(join(assets, cssName), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');

const favicon = html.match(/<link\s+rel="icon"[\s\S]*?\/>/)?.[0] ?? '';
// A literal </script> inside the bundle would close the inline tag early.
const safeJs = js.replace(/<\/script/gi, '<\\/script');

writeFileSync(
  out,
  `<title>Glide Arena</title>
${favicon}
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${safeJs}
</script>
`,
);

console.log(`wrote ${out}`);
