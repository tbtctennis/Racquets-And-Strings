import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AlertMessage } from '../../src/components/AlertMessage.tsx';

const srcRoot = new URL('../../src/', import.meta.url);

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(full)));
    else if (/\.tsx$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('AlertMessage announces every tone with role="alert"', () => {
  for (const tone of ['success', 'error', 'warning']) {
    const html = renderToStaticMarkup(React.createElement(AlertMessage, { tone }, `${tone} copy`));
    assert.match(html, /role="alert"/);
    assert.match(html, new RegExp(`${tone} copy`));
    assert.match(html, /text-sm/);
  }

  const success = renderToStaticMarkup(React.createElement(AlertMessage, { tone: 'success' }, 'Saved'));
  const error = renderToStaticMarkup(React.createElement(AlertMessage, { tone: 'error' }, 'Failed'));
  const warning = renderToStaticMarkup(React.createElement(AlertMessage, { tone: 'warning' }, 'Late'));
  assert.match(success, /text-badge-win/);
  assert.match(error, /text-badge-loss/);
  assert.match(warning, /text-badge/);
  assert.match(success, /aria-hidden="true"/);
});

test('hand-rolled banners are gone; every banner is AlertMessage', async () => {
  const files = await filesUnder(srcRoot.pathname);
  const boxedBanner =
    /rounded-(?:xl|2xl)[\s\S]{0,160}(?:bg-(?:red|green)-500\/10[\s\S]{0,80}border-(?:red|green)-500\/20|border-(?:red|green|amber)-500\/20[\s\S]{0,80}bg-(?:red|green|amber)-500\/10)/;
  const leftovers = [];
  const consumers = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const rel = path.relative(srcRoot.pathname, file);
    if (rel !== 'components/AlertMessage.tsx' && boxedBanner.test(source)) leftovers.push(rel);
    if (rel !== 'components/AlertMessage.tsx' && /from ['"][^'"]*AlertMessage['"]/.test(source)) consumers.push(rel);
  }

  assert.deepEqual(leftovers, []);
  assert.ok(consumers.length >= 11, `expected AlertMessage consumers, got ${consumers.join(', ')}`);

  const alertSource = await readFile(new URL('../../src/components/AlertMessage.tsx', import.meta.url), 'utf8');
  assert.match(alertSource, /role="alert"/);

  const sites = [
    '../../src/pages/Signup.tsx',
    '../../src/pages/Events.tsx',
    '../../src/features/events/EventsElements.tsx',
    '../../src/features/tasks/PhotoSubmitModal.tsx',
    '../../src/features/tasks/ClaimModal.tsx',
    '../../src/pages/services/ServicesElements.tsx',
    '../../src/pages/marketplace/MarketplaceElements.tsx',
    '../../src/features/profile/components/ProfileInfo.tsx',
    '../../src/features/tasks/ReviewQueue.tsx',
    '../../src/pages/tournament/MatchCard.tsx',
    '../../src/pages/Tournament.tsx',
  ];
  for (const site of sites) {
    const source = await readFile(new URL(site, import.meta.url), 'utf8');
    assert.match(source, /<AlertMessage /, `${site} is not an AlertMessage banner`);
  }
});
