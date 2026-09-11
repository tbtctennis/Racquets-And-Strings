import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ListGroup } from '../../src/components/ListGroup.tsx';
import { ListRow } from '../../src/components/ListRow.tsx';

const src = (relative) => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

const BETA_NOTICES = [
  {
    type: 'organizer_zone_change_request',
    title: 'A player changed their zone',
    body: 'Alex moved to East. They stay in their current matches; place them in the new zone’s draw when you’re ready.',
  },
  {
    type: 'ladder_declined',
    title: 'Alex declined your challenge',
    body: undefined,
  },
  {
    type: 'organizer_score_disputed',
    title: 'Result disputed',
    body: 'Players submitted different winners. The first applied result remains in place.',
  },
  {
    type: 'tournament_result_recorded',
    title: 'Win recorded: 6-4, 6-2 v. Alex',
    body: 'Your match result is now recorded.',
  },
];

test('Notifications list renders every stored item and is not filtered by type', async () => {
  const page = await src('src/pages/Notifications.tsx');
  assert.match(page, /items\.map\(\(n, i\) =>/);
  assert.match(page, /title=\{n\.title\}/);
  assert.match(page, /description=\{n\.body\}/);
  assert.doesNotMatch(page, /filter\(\([^)]*type/);
  assert.match(page, /Beta delivery is this list/);
});

test('in-app list shows zone-change, decline, dispute, and result notices', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ListGroup,
      { title: 'Notifications', labelledBy: 'notifications-list' },
      BETA_NOTICES.map((n) =>
        React.createElement(ListRow, {
          key: n.type,
          title: n.title,
          description: n.body,
        }),
      ),
    ),
  );

  assert.match(html, /A player changed their zone/);
  assert.match(html, /Alex declined your challenge/);
  assert.match(html, /Result disputed/);
  assert.match(html, /Win recorded: 6-4, 6-2 v\. Alex/);
  assert.match(html, /Players submitted different winners/);
  assert.match(html, /Your match result is now recorded/);
});

test('client types and fallbacks cover the beta channel notices', async () => {
  const hook = await src('src/features/notifications/useNotifications.ts');
  for (const type of [
    'organizer_zone_change_request',
    'ladder_declined',
    'rally_declined',
    'challenge_conversion_rejected',
    'organizer_score_disputed',
    'tournament_result_recorded',
    'tournament_score_recorded',
    'ladder_reported',
    'ladder_denied',
  ]) {
    assert.match(hook, new RegExp(`'${type}'`));
  }
  assert.match(hook, /BETA_CHANNEL_TYPES/);
  assert.match(hook, /FALLBACK_TITLE/);
});
