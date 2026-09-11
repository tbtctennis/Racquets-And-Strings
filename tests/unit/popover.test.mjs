import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Popover, PopoverRow, popoverRowClassName } from '../../src/components/Popover.tsx';

const renderPopover = (props = {}, children) =>
  renderToStaticMarkup(
    React.createElement(
      Popover,
      { onClose: () => undefined, 'aria-label': 'Choices', ...props },
      children ?? React.createElement(PopoverRow, null, 'Stanley Park'),
    ),
  );

test('Popover is an absolutely positioned surface with 44px rows', () => {
  const html = renderPopover();

  assert.match(html, /role="listbox"/);
  assert.match(html, /aria-label="Choices"/);
  assert.match(html, /absolute/);
  assert.match(html, /rounded-2xl/);
  assert.match(html, /p-1/);
  assert.match(html, /shadow-2xl/);
  assert.match(html, /bg-tennis-deep/);
  assert.match(html, /role="option"/);
  assert.match(html, /min-h-11/);
  assert.match(html, /px-3/);
  assert.match(html, /py-3/);
  assert.match(html, /Stanley Park/);
  assert.equal(popoverRowClassName.includes('min-h-11'), true);
  assert.equal(popoverRowClassName.includes('py-3'), true);
});

test('Popover stays closed until open and Escape unregisters through the overlay stack', async () => {
  const closed = renderPopover({ open: false });
  assert.equal(closed, '');

  const source = await readFile(new URL('../../src/components/Popover.tsx', import.meta.url), 'utf8');
  assert.match(source, /registerOverlay\(onClose\)/);

  const stack = await readFile(new URL('../../src/lib/overlayStack.ts', import.meta.url), 'utf8');
  assert.match(stack, /if \(event\.key !== 'Escape'\) return/);
  assert.match(stack, /overlays\.at\(-1\)\?\.close\(\)/);
});

test('ScoreModal, MatchCard, and RRGroupCard consume the shared Popover', async () => {
  const score = await readFile(new URL('../../src/pages/tournament/ScoreModal.tsx', import.meta.url), 'utf8');
  const match = await readFile(new URL('../../src/pages/tournament/MatchCard.tsx', import.meta.url), 'utf8');
  const rr = await readFile(new URL('../../src/pages/tournament/RRGroupCard.tsx', import.meta.url), 'utf8');

  assert.match(score, /from '\.\.\/\.\.\/components\/Popover'/);
  assert.match(score, /<Popover[\s\S]*open=\{showCourtDropdown && courtMatches\.length > 0\}/);
  assert.match(score, /<PopoverRow/);
  assert.doesNotMatch(score, /bg-tennis-dark\/95 p-1 shadow-2xl/);

  assert.match(match, /from '\.\.\/\.\.\/components\/Popover'/);
  assert.match(match, /<Popover[\s\S]*open=\{open\}/);
  assert.match(match, /className=\{popoverRowClassName\}/);
  assert.doesNotMatch(match, /rounded-xl bg-tennis-dark p-1 shadow-xl/);

  assert.match(rr, /from '\.\.\/\.\.\/components\/Popover'/);
  assert.match(rr, /<Popover open=\{open\}/);
  assert.match(rr, /className=\{popoverRowClassName\}/);
  assert.doesNotMatch(rr, /rounded-xl bg-tennis-dark p-1 shadow-xl/);
});

test('Popover is registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"Popover": "src\/components\/Popover\.tsx"/);
  assert.match(manifest, /"Popover": "\.design-sync\/entry\.tsx#Popover"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /Popover: \(\{ theme \}: \{ theme: 'light' \| 'dark' \}\)/);
  assert.match(entry, /<Popover open onClose=\{\(\) => \{\}\} aria-label="Court choices">/);
  assert.match(entry, /<PopoverRow>Stanley Park<\/PopoverRow>/);
});
