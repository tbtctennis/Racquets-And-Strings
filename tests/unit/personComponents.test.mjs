import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { PersonChip } from '../../src/components/PersonChip.tsx';
import { PersonInline } from '../../src/components/PersonInline.tsx';

test('PersonChip renders a compact person name without a remove control by default', () => {
  const html = renderToStaticMarkup(React.createElement(PersonChip, { name: '  Blake Bell  ' }));

  assert.match(html, /h-\[26px\]/);
  assert.match(html, />Blake Bell</);
  assert.doesNotMatch(html, /Remove Blake Bell/);
  assert.doesNotMatch(html, /<button/);
});

test('PersonChip renders an accessible optional remove control', () => {
  const html = renderToStaticMarkup(
    React.createElement(PersonChip, { name: 'Blake Bell', onRemove: () => {}, removeLabel: 'Remove player' }),
  );

  assert.match(html, /aria-label="Remove player"/);
  assert.match(html, />×</);
});

test('PersonInline formats a person reference without adding layout', () => {
  const html = renderToStaticMarkup(React.createElement(PersonInline, { name: ' Blake Bell ' }));

  assert.match(html, /<span class="font-semibold text-fg">Blake Bell<\/span>/);
  assert.doesNotMatch(html, /flex|h-\[26px\]|rounded-full/);
});

test('both person primitives preserve the shared formatter fallback', () => {
  const chip = renderToStaticMarkup(React.createElement(PersonChip, { name: '' }));
  const inline = renderToStaticMarkup(React.createElement(PersonInline, { name: '' }));

  assert.match(chip, />Player</);
  assert.match(inline, />Player</);
});

test('both person primitives are registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"PersonChip": "src\/components\/PersonChip\.tsx"/);
  assert.match(manifest, /"PersonInline": "src\/components\/PersonInline\.tsx"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /<PersonChip name="Blake Bell"/);
  assert.match(entry, /<PersonInline name="Blake Bell"/);
});
