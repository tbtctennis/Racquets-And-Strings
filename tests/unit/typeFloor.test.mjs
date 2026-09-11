import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const ROOT = new URL('../../', import.meta.url);

async function filesUnder(dir, predicate) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(full, predicate)));
    else if (predicate(entry.name, full)) files.push(full);
  }
  return files;
}

const src = (relative) => readFile(new URL(relative, ROOT), 'utf8');

/** Tailwind type utilities below the 12px floor (`text-xs`). */
const SUB_12_TEXT = /!?text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/g;

test('src classNames stay at or above the 12px type floor', async () => {
  const srcRoot = new URL('src', ROOT).pathname;
  const files = await filesUnder(srcRoot, (name) => /\.(tsx?|jsx?|css)$/.test(name));
  const hits = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const rel = path.relative(new URL('.', ROOT).pathname, file);
    for (const match of source.matchAll(SUB_12_TEXT)) {
      hits.push(`${rel}: ${match[0]}`);
    }
  }
  assert.deepEqual(hits, [], `sub-12px type utilities remain: ${hits.join(', ')}`);
});

test('TY-3: Input and Button keep text-base as the 16px control size', async () => {
  const input = await src('src/components/Input.tsx');
  const button = await src('src/components/Button.tsx');
  assert.match(input, /px-4 py-2\.5 text-base text-fg/);
  assert.match(button, /sm: 'h-11 min-h-11 px-6 rounded-2xl text-base'/);
  assert.match(button, /md: 'h-11 min-h-11 px-6 rounded-2xl text-base'/);
  assert.match(button, /lg: 'h-11 min-h-11 px-6 rounded-2xl text-base'/);
});

test('Q-11: BottomNav label is text-xs with truncate, not a 10px exception', async () => {
  const nav = await src('src/components/BottomNav.tsx');
  assert.match(nav, /max-w-full truncate text-xs font-black leading-none/);
  assert.doesNotMatch(nav, /tracking-widest/);
});
