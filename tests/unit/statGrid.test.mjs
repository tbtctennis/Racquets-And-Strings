import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir, readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatGrid } from '../../src/components/StatGrid.tsx';
import { StatTile } from '../../src/components/StatTile.tsx';

const srcRoot = new URL('../../src', import.meta.url);
const skipStatTileSources = new Set(['StatTile.tsx', 'StatGrid.tsx']);

const renderGrid = (props = {}, children) =>
  renderToStaticMarkup(
    React.createElement(
      StatGrid,
      props,
      ...(children ?? [
        React.createElement('div', { key: 'first', 'data-testid': 'first-tile' }, 'First'),
        React.createElement('div', { key: 'second', 'data-testid': 'second-tile' }, 'Second'),
      ]),
    ),
  );

async function walkTsx(dirUrl) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, `${dirUrl.href}/`);
    if (entry.isDirectory()) files.push(...(await walkTsx(url)));
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push({ name: entry.name, url, path: url.pathname });
  }
  return files;
}

test('StatGrid provides the shared responsive two-to-three-column geometry', () => {
  const markup = renderGrid();

  assert.match(markup, /class="[^"]*grid-cols-2[^"]*sm:grid-cols-3/);
  assert.match(markup, /gap-2/);
  assert.match(markup, /data-testid="first-tile"/);
  assert.match(markup, /data-testid="second-tile"/);
});

test('StatGrid keeps tile children aligned and accepts caller layout additions', () => {
  const markup = renderGrid({ className: 'mt-4' });

  assert.match(markup, /\[&amp;&gt;\*\]:h-full/);
  assert.match(markup, /\[&amp;&gt;\*\]:min-w-0/);
  assert.match(markup, /mt-4/);
});

test('StatTiles in a cluster share one stretched geometry', () => {
  const markup = renderGrid({}, [
    React.createElement(StatTile, { key: 'points', label: 'RS Points', value: 12, hint: 'earned' }),
    React.createElement(StatTile, { key: 'rewards', label: 'Rewards', value: 1 }),
  ]);

  assert.match(markup, /grid-cols-2/);
  assert.match(markup, /sm:grid-cols-3/);
  assert.match(markup, /\[&amp;&gt;\*\]:h-full/);
  assert.match(markup, />RS Points</);
  assert.match(markup, />Rewards</);
});

test('StatGrid is registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"StatGrid": "src\/components\/StatGrid\.tsx"/);
  assert.match(manifest, /"StatGrid": "\.design-sync\/entry\.tsx#StatGrid"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /StatGrid: \(\{ theme \}: \{ theme: 'light' \| 'dark' \}\)/);
  assert.match(entry, /style=\{\{ width: 360 \}\}/);
  assert.match(entry, /<StatTile label="RS Points" value=\{12\} \/>/);
});

test('every StatTile cluster is wrapped in StatGrid', async () => {
  const files = await walkTsx(srcRoot);
  const leftovers = [];

  for (const file of files) {
    if (skipStatTileSources.has(file.name)) continue;
    const source = await readFile(file.url, 'utf8');
    if (!source.includes('StatTile')) continue;
    if (!source.includes('StatGrid')) leftovers.push(file.path);
  }

  assert.deepEqual(leftovers, []);
});

test('known leftover and existing stat clusters consume StatGrid', async () => {
  const services = await readFile(new URL('../../src/pages/services/ServicesElements.tsx', import.meta.url), 'utf8');
  assert.match(services, /from '\.\.\/\.\.\/components\/StatGrid'/);
  assert.match(services, /<StatGrid>/);
  assert.doesNotMatch(services, /grid grid-cols-3/);

  const clusters = [
    '../../src/pages/Home.tsx',
    '../../src/pages/Tasks.tsx',
    '../../src/pages/Leagues.tsx',
    '../../src/components/PlayerCard.tsx',
    '../../src/components/ProfileCard.tsx',
    '../../src/pages/PlayerProfile.tsx',
    '../../src/pages/Profile.tsx',
  ];

  for (const relative of clusters) {
    const source = await readFile(new URL(relative, import.meta.url), 'utf8');
    assert.match(
      source,
      /StatGrid|DrawerLayout/,
      `${relative} should wrap its stat cluster in StatGrid or DrawerLayout (which uses StatGrid)`,
    );
  }
});
