import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Spinner } from '../../src/components/Spinner.tsx';

const renderSpinner = (props = {}) => renderToStaticMarkup(React.createElement(Spinner, props));

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(full)));
    else if (/\.(tsx?|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('Spinner announces with a clay ring and reduced-motion opt-out', () => {
  const html = renderSpinner();

  assert.match(html, /data-spinner="lg"/);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /sr-only/);
  assert.match(html, />Loading</);
  assert.match(html, /animate-spin/);
  assert.match(html, /motion-reduce:animate-none/);
  assert.match(html, /border-clay/);
  assert.match(html, /border-t-transparent/);
  assert.match(html, /h-14 w-14 border-4/);
});

test('Spinner sizes, current tone, and aria-hidden cover button and inline use', () => {
  const sm = renderSpinner({ size: 'sm', tone: 'current', className: 'mr-2', 'aria-hidden': true });
  const md = renderSpinner({ size: 'md', label: 'Finding location' });

  assert.match(sm, /data-spinner="sm"/);
  assert.match(sm, /h-4 w-4 border-2/);
  assert.match(sm, /border-current/);
  assert.match(sm, /mr-2/);
  assert.match(sm, /aria-hidden="true"/);
  assert.doesNotMatch(sm, /role="status"/);
  assert.doesNotMatch(sm, /sr-only/);

  assert.match(md, /data-spinner="md"/);
  assert.match(md, /h-8 w-8 border-2/);
  assert.match(md, />Finding location</);
});

test('Spinner is registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"Spinner": "src\/components\/Spinner\.tsx"/);
  assert.match(manifest, /"Spinner": "\.design-sync\/entry\.tsx#Spinner"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /Spinner: \(\{ theme \}: \{ theme: 'light' \| 'dark' \}\)/);
  assert.match(entry, /<Spinner size="sm"/);
  assert.match(entry, /<Spinner size="md"/);
  assert.match(entry, /<Spinner size="lg"/);
  assert.match(entry, /tone="current"/);
});

test('owned call sites consume Spinner and the Loader2 mechanism is gone', async () => {
  const srcRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../src');
  const files = await filesUnder(srcRoot);
  const sources = await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')]));

  const loaderSpinners = sources.filter(([, source]) => /<Loader2\b/.test(source));
  assert.deepEqual(
    loaderSpinners.map(([file]) => path.relative(srcRoot, file)),
    [],
  );

  const inlineClayRings = sources.filter(([, source]) =>
    /border-4 border-clay border-t-transparent rounded-full animate-spin/.test(source),
  );
  assert.deepEqual(
    inlineClayRings.map(([file]) => path.relative(srcRoot, file)),
    [],
  );

  const button = await readFile(new URL('../../src/components/Button.tsx', import.meta.url), 'utf8');
  const layout = await readFile(new URL('../../src/components/Layout.tsx', import.meta.url), 'utf8');
  const app = await readFile(new URL('../../src/App.tsx', import.meta.url), 'utf8');
  const courtMap = await readFile(new URL('../../src/pages/CourtMap.tsx', import.meta.url), 'utf8');

  assert.match(button, /<Spinner size="sm" tone="current"/);
  assert.doesNotMatch(button, /border-2 border-current border-t-transparent/);
  assert.match(layout, /<Spinner \/>/);
  assert.match(app, /<Spinner \/>/);
  assert.match(courtMap, /<Spinner size="sm" \/>/);
  assert.doesNotMatch(courtMap, /Loader2/);
});
