import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Skeleton } from '../../src/components/Skeleton.tsx';

const renderSkeleton = (props = {}) => renderToStaticMarkup(React.createElement(Skeleton, props));

test('row and ListRow skeletons inherit the 44px list-row height', () => {
  const row = renderSkeleton();
  const listRow = renderSkeleton({ as: 'ListRow' });

  assert.match(row, /data-skeleton="row"/);
  assert.match(row, /h-11/);
  assert.match(listRow, /data-skeleton="ListRow"/);
  assert.match(listRow, /h-11/);
});

test('block and EntityCard skeletons inherit their target radius and height', () => {
  const block = renderSkeleton({ as: 'block' });
  const card = renderSkeleton({ as: 'EntityCard' });
  const person = renderSkeleton({ as: 'PersonRow' });

  assert.match(block, /h-40/);
  assert.match(block, /rounded-3xl/);
  assert.match(card, /h-40/);
  assert.match(card, /rounded-2xl/);
  assert.match(person, /h-\[57px\]/);
  assert.doesNotMatch(person, /rounded-3xl|rounded-2xl/);
});

test('radius and height props override the inherited target shape', () => {
  const html = renderSkeleton({ as: 'row', height: 'h-16', radius: 'rounded-3xl' });

  assert.match(html, /h-16/);
  assert.match(html, /rounded-3xl/);
  assert.doesNotMatch(html, /h-11/);
});

test('skeleton fill and pulse use theme-flipping tokens', () => {
  const html = renderSkeleton({ as: 'ListRow' });

  assert.match(html, /animate-pulse/);
  assert.match(html, /bg-fg\/10/);
  assert.doesNotMatch(html, /bg-tennis-surface/);
});

test('skeleton announces loading unless the caller hides it', () => {
  const visible = renderSkeleton();
  const hidden = renderSkeleton({ 'aria-hidden': true });

  assert.match(visible, /role="status"/);
  assert.match(visible, /aria-busy="true"/);
  assert.match(visible, /aria-label="Loading"/);
  assert.match(hidden, /aria-hidden="true"/);
  assert.doesNotMatch(hidden, /role="status"/);
});

test('Skeleton is registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"Skeleton": "src\/components\/Skeleton\.tsx"/);
  assert.match(manifest, /"Skeleton": "\.design-sync\/entry\.tsx#Skeleton"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /Skeleton: \(\{ theme \}: \{ theme: 'light' \| 'dark' \}\)/);
  assert.match(entry, /<Skeleton as="ListRow"/);
  assert.match(entry, /<Skeleton as="PersonRow"/);
  assert.match(entry, /<Skeleton as="EntityCard"/);
  assert.match(entry, /<Skeleton as="block"/);
});

test('Notifications loading rows consume Skeleton at ListRow height', async () => {
  const page = await readFile(new URL('../../src/pages/Notifications.tsx', import.meta.url), 'utf8');

  assert.match(page, /import \{ Skeleton \} from '\.\.\/components\/Skeleton'/);
  assert.match(page, /<Skeleton key=\{i\} as="ListRow"/);
  assert.doesNotMatch(page, /bg-tennis-surface\/30 rounded-2xl animate-pulse/);
});
