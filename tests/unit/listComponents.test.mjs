import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ListGroup } from '../../src/components/ListGroup.tsx';
import { ListRow } from '../../src/components/ListRow.tsx';

test('ListRow keeps the main content flexible and exposes compact slots', () => {
  const html = renderToStaticMarkup(
    React.createElement(ListRow, {
      leading: React.createElement('span', null, 'icon'),
      title: 'A long player name',
      description: 'Additional context',
      meta: '12',
      trailing: 'Done',
      action: React.createElement('button', { type: 'button' }, 'Open'),
    }),
  );

  assert.match(html, /min-w-\[40%\]/);
  assert.match(html, /min-w-0 flex-1/);
  assert.match(html, /truncate/);
  assert.match(html, /w-\[78px\]/);
  assert.match(html, /A long player name/);
  assert.match(html, /Additional context/);
});

test('ListRow renders interactive rows as native controls', () => {
  const button = renderToStaticMarkup(React.createElement(ListRow, { title: 'Choose', onClick: () => undefined }));
  const link = renderToStaticMarkup(React.createElement(ListRow, { title: 'Details', href: '/details' }));

  assert.match(button, /^<button[^>]+type="button"/);
  assert.match(button, /Choose/);
  assert.match(link, /^<a[^>]+href="\/details"/);
});

test('ListGroup supplies a labelled, filled, separated surface and optional count', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ListGroup,
      { title: 'Pending', count: 2, description: 'Needs review' },
      React.createElement(ListRow, { title: 'First' }),
      React.createElement(ListRow, { title: 'Second' }),
    ),
  );

  assert.match(html, /role|aria-labelledby/);
  assert.match(html, /bg-tennis-surface\/40/);
  assert.match(html, /border-fg\/10/);
  assert.match(html, />2</);
  assert.match(html, /Pending/);
  assert.match(html, /First/);
  assert.match(html, /Second/);
});

test('ListRow keeps title and description on one truncated line at 360px', () => {
  const html = renderToStaticMarkup(
    React.createElement(ListRow, {
      title: 'Annas Tariq',
      description: 'Completed today',
      trailing: '6–4 6–3',
    }),
  );

  assert.match(html, /min-h-11/);
  assert.match(html, /min-w-\[40%\]/);
  assert.match(html, /min-w-0 flex-1/);
  assert.match(html, /truncate whitespace-nowrap text-sm font-semibold/);
  assert.match(html, /truncate whitespace-nowrap text-xs text-fg\/70/);
  assert.match(html, /max-w-\[35%\] min-w-0 truncate/);
  assert.match(html, /Annas Tariq/);
});

test('remaining list surfaces consume ListRow inside ListGroup', async () => {
  const files = [
    '../../src/pages/History.tsx',
    '../../src/pages/Events.tsx',
    '../../src/pages/Notifications.tsx',
    '../../src/pages/Profile.tsx',
    '../../src/features/payments/PaymentsList.tsx',
    '../../src/features/services/BookingsList.tsx',
    '../../src/features/tasks/ReviewQueue.tsx',
    '../../src/features/tasks/CheckInModal.tsx',
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /import \{ ListRow \} from /, `${file} does not import ListRow`);
    assert.match(source, /<ListRow[\s>]/, `${file} does not render ListRow`);
    assert.match(source, /<ListGroup[\s>]/, `${file} does not render ListGroup`);
  }

  const history = await readFile(new URL('../../src/pages/History.tsx', import.meta.url), 'utf8');
  const events = await readFile(new URL('../../src/pages/Events.tsx', import.meta.url), 'utf8');
  const profile = await readFile(new URL('../../src/pages/Profile.tsx', import.meta.url), 'utf8');
  const reviewQueue = await readFile(new URL('../../src/features/tasks/ReviewQueue.tsx', import.meta.url), 'utf8');
  const checkIn = await readFile(new URL('../../src/features/tasks/CheckInModal.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(history, /flex items-center gap-3 px-4 py-3\.5/);
  assert.doesNotMatch(events, /flex items-center gap-3 px-4 py-3\.5/);
  assert.doesNotMatch(profile, /divide-y divide-white\/5 rounded-2xl overflow-hidden">\s*\{recentMatches/);
  assert.doesNotMatch(reviewQueue, /rounded-2xl bg-tennis-surface\/40 px-3 py-2\.5/);
  assert.doesNotMatch(checkIn, /rounded-2xl bg-tennis-surface\/40 divide-y divide-white\/5/);
});
