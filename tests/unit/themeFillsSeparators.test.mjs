import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const srcRoot = new URL('../../src/', import.meta.url);

const HEX_FILL_OR_RULE = /(?:bg|border|divide)-\[#[0-9a-fA-F]{3,8}\]/g;
const DIVIDE_WHITE = /divide-white(?:\/\d+)?/g;
const WHITE_ALPHA_FILL = /(?:hover:)?bg-white\/\[0\.\d+\]/g;

/** TASK-583 tokenised court-map marker colours; no className hex fills remain. */
const HEX_EXCEPTIONS = new Set();

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

function count(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

function hits(source, pattern) {
  return source.match(pattern) ?? [];
}

test('theme-blind white fills and separators are gone; remaining hex fills are allowed exceptions', async () => {
  const files = await walkSource(srcRoot);
  const divideWhite = [];
  const whiteFills = [];
  const hexHits = [];
  const hexAllowed = [];

  for (const file of files) {
    const source = await readFile(file.url, 'utf8');
    const separators = count(source, DIVIDE_WHITE);
    const fills = count(source, WHITE_ALPHA_FILL);
    const hex = hits(source, HEX_FILL_OR_RULE);

    if (separators) divideWhite.push(`${file.rel}:${separators}`);
    if (fills) whiteFills.push(`${file.rel}:${fills}`);
    if (hex.length) {
      const bucket = HEX_EXCEPTIONS.has(file.rel) ? hexAllowed : hexHits;
      bucket.push(`${file.rel}:${hex.length}:${hex.join(',')}`);
    }
  }

  const divideWhiteCount = divideWhite.reduce((n, row) => n + Number(row.split(':').at(-1)), 0);
  const whiteFillCount = whiteFills.reduce((n, row) => n + Number(row.split(':').at(-1)), 0);
  const hexLeftoverCount = hexHits.reduce((n, row) => n + Number(row.split(':')[1]), 0);
  const hexExceptionCount = hexAllowed.reduce((n, row) => n + Number(row.split(':')[1]), 0);

  assert.equal(divideWhiteCount, 0, `divide-white separators remain: ${divideWhite.join('; ')}`);
  assert.equal(whiteFillCount, 0, `bg-white/[0.x] fills remain: ${whiteFills.join('; ')}`);
  assert.deepEqual(hexHits, [], `hex fills/rules outside exceptions: ${hexHits.join('; ')}`);
  assert.equal(hexLeftoverCount, 0);
  assert.equal(hexExceptionCount, 0, `hex className fills should be gone: ${hexAllowed.join('; ')}`);
});
