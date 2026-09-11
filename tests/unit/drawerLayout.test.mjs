import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DrawerLayout } from '../../src/components/DrawerLayout.tsx';
import { PlayerCard } from '../../src/components/PlayerCard.tsx';

const fourStats = [
  { label: 'P/G Won %', value: '48%' },
  { label: 'Wins', value: '12' },
  { label: 'Matches', value: '20' },
  { label: 'Contact', value: '—' },
];

test('DrawerLayout lays four tiles out as a 2×2 through StatGrid', () => {
  const html = renderToStaticMarkup(React.createElement(DrawerLayout, { open: true, stats: fourStats }));

  assert.match(html, /grid-cols-2/);
  assert.match(html, /sm:grid-cols-2/);
  assert.doesNotMatch(html, /grid-cols-4/);
  assert.doesNotMatch(html, /sm:grid-cols-3/);
  assert.doesNotMatch(html, /col-span-2/);
  assert.match(html, /P\/G Won %/);
  assert.match(html, /Wins/);
  assert.match(html, /Matches/);
  assert.match(html, /Contact/);
  assert.match(html, /rounded-xl bg-fg\/\[0\.03\]/);
});

test('DrawerLayout spans an odd trailing tile across the two-column row', () => {
  const html = renderToStaticMarkup(
    React.createElement(DrawerLayout, {
      open: true,
      stats: [...fourStats, { label: 'Rank Move', value: '—' }],
    }),
  );

  assert.match(html, /col-span-2/);
  assert.match(html, /Rank Move/);
});

test('DrawerLayout hides labelled chrome when closed and omits empty captions', () => {
  const closed = renderToStaticMarkup(React.createElement(DrawerLayout, { open: false, stats: fourStats }));
  const open = renderToStaticMarkup(
    React.createElement(DrawerLayout, {
      open: true,
      pills: React.createElement('span', null, 'Nearby'),
      stats: [
        { label: '', value: 'Tags' },
        { label: 'Wins', value: '3' },
      ],
    }),
  );

  assert.equal(closed, '');
  assert.match(open, /Nearby/);
  assert.match(open, />Tags</);
  assert.match(open, /Wins/);
  assert.doesNotMatch(open, /uppercase tracking-wide[^>]*>\s*</);
});

test('PlayerCard expanded drawers render through DrawerLayout', () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCard, {
      id: 'u1',
      name: 'blake bell',
      open: true,
      onToggle() {},
      stats: fourStats,
    }),
  );

  assert.match(html, /id="player-card-u1"/);
  assert.match(html, /sm:grid-cols-2/);
  assert.match(html, /P\/G Won %/);
  assert.doesNotMatch(html, /grid-cols-4/);
});

test('DrawerLayout is registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"DrawerLayout": "src\/components\/DrawerLayout\.tsx"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /DrawerLayout: \(\{ theme \}/);
  assert.match(entry, /<DrawerLayout[\s\S]*open[\s\S]*P\/G Won %/);
});

test('expanded drawer call sites consume DrawerLayout instead of a local grid', async () => {
  const playerCard = await readFile(new URL('../../src/components/PlayerCard.tsx', import.meta.url), 'utf8');
  const matches = await readFile(new URL('../../src/pages/Matches.tsx', import.meta.url), 'utf8');
  const drawer = await readFile(new URL('../../src/components/DrawerLayout.tsx', import.meta.url), 'utf8');

  assert.match(playerCard, /from '\.\/DrawerLayout'/);
  assert.match(playerCard, /<DrawerLayout/);
  assert.doesNotMatch(playerCard, /StatGrid|grid-cols-4|col-span-2/);
  assert.match(matches, /from '\.\.\/components\/PlayerCard'/);
  assert.doesNotMatch(matches, /grid-cols-4/);
  assert.match(drawer, /StatGrid className="sm:grid-cols-2"/);
});
