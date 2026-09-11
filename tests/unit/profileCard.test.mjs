import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProfileCard } from '../../src/components/ProfileCard.tsx';

const base = {
  name: 'blake bell',
  bio: 'Evenings on clay.',
  skillLevel: 3.5,
  league: "Men's",
  courts: ['Stanley Park'],
  zone: 'Downtown - Midtown',
  favourites: ['Roger Federer'],
  phone: '(416)-555-0123',
  email: 'blake@example.com',
  matches: [{ won: true }, { won: true }, { won: false }],
  pgWonPct: '48%',
};

const render = (props) => renderToStaticMarkup(React.createElement(ProfileCard, props));

test('own and public modes share the Contact label and drop Phone', () => {
  const own = render({ mode: 'own', ...base, availableToPlay: true });
  const pub = render({ mode: 'public', ...base });

  assert.match(own, />Contact</);
  assert.match(pub, />Contact</);
  assert.doesNotMatch(own, />Phone</);
  assert.doesNotMatch(pub, />Phone</);
});

test('public mode never prints private contact values and keeps own-only rows off the card', () => {
  const html = render({
    mode: 'public',
    name: base.name,
    bio: base.bio,
    skillLevel: base.skillLevel,
    league: base.league,
    courts: base.courts,
    zone: base.zone,
    favourites: base.favourites,
    matches: base.matches,
    pgWonPct: base.pgWonPct,
  });

  assert.doesNotMatch(html, /\(416\)-555-0123/);
  assert.doesNotMatch(html, /blake@example.com/);
  assert.doesNotMatch(html, /Email Notifications/);
  assert.doesNotMatch(html, /Available to play/);
  assert.doesNotMatch(html, />WhatsApp Contact</);
  assert.doesNotMatch(html, />Zone</);
  assert.match(html, /Contact details show once you have an accepted challenge or rally/);
});

test('public mode offers channel buttons when a contacts read succeeded, still without printing the number', () => {
  const html = render({ mode: 'public', ...base, phone: '4165550123' });

  assert.match(html, /sms:\+14165550123/);
  assert.match(html, />SMS</);
  assert.doesNotMatch(html, /4165550123</);
});

test('own mode shows the member contact value, availability, and zone', () => {
  const html = render({
    mode: 'own',
    ...base,
    availableToPlay: true,
    availabilityTags: ['weekday_evenings', 'weekend_mornings'],
  });

  assert.match(html, /\(416\)-555-0123/);
  assert.match(html, />Availability</);
  assert.match(html, /Available to play/);
  assert.match(html, /Weekday Evenings/);
  assert.match(html, /Weekend Mornings/);
  assert.match(html, />Zone</);
  assert.match(html, /Downtown - Midtown/);
  assert.match(html, /data-mode="own"/);
  assert.match(html, />Support the league</);
});

test('own mode edits the full availability model, not only available_to_play', () => {
  const html = render({
    mode: 'own',
    ...base,
    availableToPlay: false,
    availabilityTags: ['weekday_mornings', 'weekday_evenings'],
    editors: {
      availability: React.createElement('button', { type: 'button' }, 'Save Availability tags'),
    },
  });

  assert.match(html, /Available to play/);
  assert.match(html, />Away</);
  assert.match(html, /Save Availability tags/);
  assert.doesNotMatch(html, /Weekday Mornings/);
  assert.doesNotMatch(html, />Weekdays</);
});

test('public mode keeps Support the league off the card', () => {
  const html = render({ mode: 'public', ...base });
  assert.doesNotMatch(html, /Support the league/);
});

test('streak and P/G won % ride the card from shared inputs', () => {
  const html = render({ mode: 'public', ...base });

  assert.match(html, />2W</);
  assert.match(html, />P\/G Won %</);
  assert.match(html, />48%</);
});

test('the card title-cases names and uses the 96px profile avatar', () => {
  const html = render({ mode: 'public', name: 'blake bell' });

  assert.match(html, />Blake Bell</);
  assert.match(html, /h-24 w-24/);
  assert.match(html, />B<\/span>/);
});

test('ProfileCard is registered with light and dark 360px previews for both modes', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"ProfileCard": "src\/components\/ProfileCard\.tsx"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /mode="own"/);
  assert.match(entry, /mode="public"/);
  assert.match(entry, /width: 360/);
  assert.match(entry, /payments=\{\[\{ type: 'donation', state: 'succeeded' \}\]\}/);
});

test('the Contributor badge appears from a payment record on the shared card and drops on refund', async () => {
  const donation = [{ type: 'donation', state: 'succeeded' }];
  const requested = [{ type: 'donation', state: 'succeeded', cancellation_status: 'requested' }];
  const refunded = [{ type: 'donation', state: 'refunded' }];
  const mixed = [
    { type: 'donation', state: 'refunded' },
    { type: 'donation', state: 'succeeded' },
    { type: 'donation', state: 'succeeded' },
  ];

  const own = render({ mode: 'own', ...base, payments: donation });
  const pub = render({ mode: 'public', ...base, payments: donation });
  assert.match(own, />Contributor</);
  assert.match(pub, />Contributor</);

  assert.match(render({ mode: 'public', ...base, payments: requested }), />Contributor</);
  assert.doesNotMatch(render({ mode: 'own', ...base, payments: refunded }), />Contributor</);
  assert.doesNotMatch(render({ mode: 'public', ...base }), />Contributor</);
  assert.match(render({ mode: 'own', ...base, payments: mixed }), />Contributor</);

  const info = await readFile(
    new URL('../../src/features/profile/components/ProfileInfo.tsx', import.meta.url),
    'utf8',
  );
  assert.match(info, /usePayments/);
  assert.match(info, /payments=\{payments\}/);
  assert.doesNotMatch(info, /contributor\s*:/);
});
