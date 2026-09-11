import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const css = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8');
const srcRoot = new URL('../../src/', import.meta.url);

async function walkSource(dirUrl, prefix = '') {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dirUrl);
    if (entry.isDirectory()) files.push(...(await walkSource(url, rel)));
    else if (/\.(tsx?|css)$/.test(entry.name)) files.push({ rel, url });
  }
  return files;
}

function block(source, selector) {
  const start = source.indexOf(selector);
  assert.ok(start >= 0, `missing ${selector}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`unclosed ${selector}`);
}

function token(source, name) {
  const match = source.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match?.[1].trim() ?? null;
}

function classChunks(source) {
  const chunks = [];
  const re = /(?:className=\{?`([^`]+)`|className="([^"]+)"|className='([^']+)'|(?:const|let)\s+\w+\s*=\s*'([^']+)')/g;
  let match;
  while ((match = re.exec(source))) {
    chunks.push(match[1] || match[2] || match[3] || match[4]);
  }
  return chunks;
}

function tokensOf(chunk) {
  return chunk.split(/[\s]+/).filter(Boolean);
}

function isBorderWidth(tok) {
  const bare = tok.replace(/^(hover|focus|focus-within|active|group-hover|disabled):/, '');
  return /^(border|border-[trblxyse]|border-(0|2|4|8))$/.test(bare);
}

function isHoverBorderColor(tok) {
  return /^(hover|focus-within):border-/.test(tok) && !isBorderWidth(tok);
}

function isOffLadderRadius(tok) {
  const bare = tok.replace(/^(sm|md|lg|max-sm|max-md):/, '');
  if (/^rounded-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|ee|es)-/.test(bare)) {
    const step = bare.replace(/^rounded-(?:t|b|l|r|tl|tr|bl|br|s|e|ss|se|ee|es)-/, '');
    return !/^(none|xl|2xl|3xl|4xl|full)$/.test(step);
  }
  if (bare === 'rounded' || /^rounded-(?:sm|md|lg)$/.test(bare) || /^rounded-\[/.test(bare)) return true;
  return false;
}

const files = await walkSource(srcRoot);
const sources = await Promise.all(files.map(async (file) => ({ ...file, source: await readFile(file.url, 'utf8') })));

test('radius, duration, and elevation tokens live in index.css for both themes', () => {
  const theme = block(css, '@theme');
  assert.equal(token(theme, '--radius-xl'), '0.75rem');
  assert.equal(token(theme, '--radius-2xl'), '1rem');
  assert.equal(token(theme, '--radius-3xl'), '1.5rem');
  assert.equal(token(theme, '--radius-4xl'), '2rem');
  assert.equal(token(theme, '--duration-fast'), '150ms');
  assert.equal(token(theme, '--duration-motion'), '200ms');
  assert.equal(token(theme, '--duration-hero'), '1000ms');
  assert.equal(token(theme, '--default-transition-duration'), '200ms');

  assert.match(css, /:root\s*\{[^}]*--card-shadow:\s*none;/s);
  assert.match(css, /:root\s*\{[^}]*--featured-shadow:\s*none;/s);
  assert.match(css, /:root\s*\{[^}]*--shadow-pullup:\s*0 -8px 24px rgb\(0 0 0 \/ 0\.4\);/s);

  const lightBlocks = [];
  let from = 0;
  while (true) {
    const idx = css.indexOf(":root[data-theme='light']", from);
    if (idx < 0) break;
    lightBlocks.push(block(css.slice(idx), ":root[data-theme='light']"));
    from = idx + 1;
  }
  const light = lightBlocks.join('\n');
  assert.equal(token(light, '--card-shadow'), '0 8px 24px rgb(20 61 52 / 0.08)');
  assert.equal(token(light, '--featured-shadow'), '0 12px 32px rgb(20 61 52 / 0.14)');
  assert.equal(token(light, '--shadow-pullup'), '0 -8px 24px rgb(20 61 52 / 0.12)');
  assert.match(css, /\.card-shadow\s*\{[^}]*box-shadow:\s*var\(--card-shadow, none\);/s);
  assert.match(css, /\.featured-shadow\s*\{[^}]*box-shadow:\s*var\(--featured-shadow, none\);/s);
  assert.match(css, /\.shadow-pullup\s*\{[^}]*box-shadow:\s*var\(--shadow-pullup\);/s);
});

test('TASK-576 page names, clay fill, and map marker colours stay put', () => {
  const theme = block(css, '@theme');
  const light = block(css, ":root[data-theme='light']");
  assert.equal(token(theme, '--color-page'), '#0b3027');
  assert.equal(token(light, '--color-page'), '#deded5');
  assert.equal(token(theme, '--color-clay'), '#e84a27');
  assert.equal(token(theme, '--color-clay-fg'), '#ff8a65');
  assert.equal(token(light, '--color-clay'), '#ff6b35');
  assert.equal(token(light, '--color-clay-fg'), '#9e2d12');
  assert.equal(token(theme, '--color-map-active'), 'var(--color-green-700)');
  assert.equal(token(theme, '--color-map-programs'), 'var(--color-yellow-500)');
  assert.equal(token(theme, '--color-map-open'), 'var(--color-blue-500)');
  assert.equal(token(theme, '--color-map-club'), 'var(--color-orange-500)');
  assert.equal(token(theme, '--color-map-idle'), 'var(--color-slate-400)');
});

test('overrides 4 → 0, dead hover borders 5 → 0, transitions are specified', () => {
  const important = [];
  const deadHover = [];
  const bareTransition = [];
  const offLadder = [];
  const unspecifiedAll = [];

  for (const file of sources) {
    if (/!(?:px-|py-|pt-|pb-|pl-|pr-|p-|m-|h-|w-|min-h-|min-w-|text-|rounded)/.test(file.source)) {
      important.push(file.rel);
    }

    const chunks = classChunks(file.source);
    const fileClassTokens = new Set(chunks.flatMap(tokensOf));

    for (const chunk of chunks) {
      const toks = tokensOf(chunk);
      const hasWidth = toks.some(isBorderWidth) || (chunk.includes('${cls}') && fileClassTokens.has('border'));
      if (toks.some(isHoverBorderColor) && !hasWidth) deadHover.push(`${file.rel}:${chunk.slice(0, 80)}`);
      for (const tok of toks) {
        if (isOffLadderRadius(tok)) offLadder.push(`${file.rel}:${tok}`);
      }
      if (toks.includes('transition-all') && !toks.some((tok) => tok.startsWith('duration-'))) {
        unspecifiedAll.push(file.rel);
      }
    }

    if (/(?:^|[\s"'`])transition(?:[\s"'`]|$)/.test(file.source) && file.rel !== 'index.css') {
      const lines = file.source.split('\n');
      for (const [i, line] of lines.entries()) {
        if (!/(?:^|[\s"'`])transition(?:[\s"'`]|$)/.test(line)) continue;
        if (/transition-(?:colors|opacity|transform|all|none|shadow|property)/.test(line)) continue;
        if (/transition=\{/.test(line)) continue;
        if (/booking transition|points-moving/.test(line)) continue;
        bareTransition.push(`${file.rel}:${i + 1}`);
      }
    }
  }

  assert.deepEqual(important, []);
  assert.deepEqual(deadHover, []);
  assert.deepEqual(bareTransition, []);
  assert.deepEqual(offLadder, []);
  assert.deepEqual(unspecifiedAll, []);
});

test('nested trays keep concentric corners', async () => {
  const segmented = await readFile(new URL('../../src/components/SegmentedControl.tsx', import.meta.url), 'utf8');
  const popover = await readFile(new URL('../../src/components/Popover.tsx', import.meta.url), 'utf8');
  const filters = await readFile(new URL('../../src/pages/courtmap/CourtMapElements.tsx', import.meta.url), 'utf8');

  assert.match(segmented, /flex bg-fg\/5 rounded-2xl p-1/);
  assert.match(segmented, /rounded-xl py-3/);
  assert.match(popover, /rounded-2xl bg-tennis-deep p-1 shadow-2xl/);
  assert.match(popover, /min-h-11 rounded-xl px-3 py-3/);
  assert.match(filters, /rounded-2xl p-1/);
  assert.match(filters, /rounded-xl px-2 py-1\.5/);
  assert.match(filters, /<SelectSheet/);
});

test('named motion steps replace duration-300 and the 1000ms hero stays named', async () => {
  const motion = await readFile(new URL('../../src/lib/motion.ts', import.meta.url), 'utf8');
  const home = await readFile(new URL('../../src/pages/Home.tsx', import.meta.url), 'utf8');
  const navbar = await readFile(new URL('../../src/components/Navbar.tsx', import.meta.url), 'utf8');
  const knockout = await readFile(new URL('../../src/pages/tournament/RoundRobinView.tsx', import.meta.url), 'utf8');
  const input = await readFile(new URL('../../src/components/Input.tsx', import.meta.url), 'utf8');

  assert.match(motion, /duration: 0\.2/);
  assert.doesNotMatch(motion, /duration: 0\.3/);
  assert.match(home, /transition-opacity duration-hero/);
  assert.match(navbar, /transition-all duration-motion/);
  assert.match(knockout, /controlChrome\(currentSize === size\)/);
  assert.doesNotMatch(knockout, /hover:text-fg/);
  assert.match(input, /export const field =/);
  assert.match(input, /transition-all duration-motion/);
  assert.match(input, /from '\.\/FieldError'/);

  const joined = sources.map((file) => file.source).join('\n');
  assert.doesNotMatch(joined, /duration-300/);
  assert.doesNotMatch(joined, /duration-1000/);
  const nativeSelect = sources
    .filter((file) => file.rel.endsWith('.tsx'))
    .filter((file) => /<select[\s>]/.test(file.source))
    .map((file) => file.rel);
  assert.deepEqual(nativeSelect, []);
});
