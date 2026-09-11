import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const HEXES = ['#15803d', '#eab308', '#f97316', '#94a3b8'];
const COURT_MAP_FILES = [
  '../../src/pages/CourtMap.tsx',
  '../../src/pages/courtmap/courtMapUtils.ts',
  '../../src/pages/courtmap/CourtMapElements.tsx',
  '../../src/pages/courtmap/useCourtData.ts',
];

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(full)));
    else if (/\.(css|tsx?|mjs)$/.test(entry.name)) files.push(full);
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

test('the four court-map marker hexes are gone from src/', async () => {
  const srcRoot = new URL('../../src/', import.meta.url);
  const files = await filesUnder(srcRoot.pathname);
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n').toLowerCase();
  for (const hex of HEXES) {
    assert.equal(source.includes(hex), false, `${hex} still in src/`);
  }
});

test('court-map files have no hex colour literals', async () => {
  const hex = /#(?:[0-9a-fA-F]{3,8})\b/;
  for (const rel of COURT_MAP_FILES) {
    const source = await readFile(new URL(rel, import.meta.url), 'utf8');
    assert.doesNotMatch(source, hex, `${rel} still has a hex literal`);
  }
});

test('legend and markers share MARKER_COLOR tokens', async () => {
  const utils = await readFile(new URL('../../src/pages/courtmap/courtMapUtils.ts', import.meta.url), 'utf8');
  const page = await readFile(new URL('../../src/pages/CourtMap.tsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8');
  const badges = await readFile(new URL('../../src/pages/courtmap/CourtMapElements.tsx', import.meta.url), 'utf8');

  assert.match(utils, /export const MARKER_COLOR/);
  assert.match(utils, /var\(--color-map-active\)/);
  assert.match(utils, /MARKER_COLOR\.active/);
  assert.match(utils, /MARKER_COLOR\.programs/);
  assert.match(utils, /MARKER_COLOR\.open/);
  assert.match(utils, /MARKER_COLOR\.club/);
  assert.match(utils, /MARKER_COLOR\.idle/);
  assert.match(page, /MARKER_COLOR\.active/);
  assert.match(page, /MARKER_COLOR\.programs/);
  assert.match(page, /MARKER_COLOR\.open/);
  assert.match(css, /--color-map-active:\s*var\(--color-green-700\)/);
  assert.match(css, /--color-map-programs:\s*var\(--color-yellow-500\)/);
  assert.match(css, /--color-map-open:\s*var\(--color-blue-500\)/);
  assert.match(css, /--color-map-club:\s*var\(--color-orange-500\)/);
  assert.match(css, /--color-map-idle:\s*var\(--color-slate-400\)/);
  assert.doesNotMatch(badges, /\bbg=["']#|\bcolor=["']#/);
});

test('map tokens do not revert TASK-578 clay', async () => {
  const css = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8');
  const theme = block(css, '@theme');
  const light = block(css, ":root[data-theme='light']");
  assert.equal(token(theme, '--color-clay'), '#e84a27');
  assert.equal(token(theme, '--color-clay-fg'), '#ff8a65');
  assert.equal(token(light, '--color-clay'), '#ff6b35');
  assert.equal(token(light, '--color-clay-fg'), '#9e2d12');
});
