import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewPanel } from '../../src/components/ReviewPanel.tsx';

test('ReviewPanel renders a counted queue and hides empty queues', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ReviewPanel,
      { title: 'Pending', count: 2, defaultOpen: true },
      React.createElement('p', null, 'item'),
    ),
  );
  assert.match(html, /Pending \(2\)/);
  assert.match(html, /item/);
  assert.match(html, /border-amber-500\/20/);
  assert.match(html, /bg-amber-500\/5/);
  assert.equal(renderToStaticMarkup(React.createElement(ReviewPanel, { title: 'Empty', count: 0 }, 'item')), '');
});

test('ReviewPanel stays collapsed until opened', () => {
  const html = renderToStaticMarkup(
    React.createElement(ReviewPanel, { title: 'Pending', count: 2 }, React.createElement('p', null, 'item')),
  );
  assert.match(html, /Pending \(2\)/);
  assert.doesNotMatch(html, />item</);
  assert.match(html, /aria-expanded="false"/);
});

test('ReviewPanel is registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"ReviewPanel": "src\/components\/ReviewPanel\.tsx"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /ReviewPanel: \(\{ theme \}/);
  assert.match(entry, /<ReviewPanel title="Task approvals" count=\{2\} defaultOpen>/);
});

test('organizer queues consume ReviewPanel instead of custom amber chrome', async () => {
  const reviewQueue = await readFile(new URL('../../src/features/tasks/ReviewQueue.tsx', import.meta.url), 'utf8');
  const tournament = await readFile(
    new URL('../../src/pages/tournament/TournamentElements.tsx', import.meta.url),
    'utf8',
  );
  const services = await readFile(new URL('../../src/pages/services/ServicesElements.tsx', import.meta.url), 'utf8');

  assert.match(reviewQueue, /from '\.\.\/\.\.\/components\/ReviewPanel'/);
  assert.match(reviewQueue, /title="Task approvals"/);
  assert.match(reviewQueue, /title="Coupon decisions"/);
  assert.match(reviewQueue, /title="Cancellation requests"/);
  assert.doesNotMatch(reviewQueue, /border-amber-400/);
  assert.doesNotMatch(reviewQueue, /Needs your review/);

  assert.match(tournament, /from '\.\.\/\.\.\/components\/ReviewPanel'/);
  assert.match(tournament, /title="Scheduling requested"/);
  assert.match(tournament, /title="Unplaced players"/);
  assert.doesNotMatch(tournament, /QueueDropdown/);

  assert.match(services, /from '\.\.\/\.\.\/components\/ReviewPanel'/);
  assert.match(services, /title="Your shop"/);
  assert.doesNotMatch(services, /border-amber-400/);
});
