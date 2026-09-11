import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EntityCard } from '../../src/components/EntityCard.tsx';

const renderCard = (props = {}, children) =>
  renderToStaticMarkup(
    React.createElement(
      EntityCard,
      {
        title: React.createElement('h3', null, 'Saturday social'),
        ...props,
      },
      children,
    ),
  );

test('EntityCard renders one shared footer from footerMeta and footerAction', () => {
  const html = renderCard({
    footerMeta: React.createElement('span', null, 'June 15'),
    footerAction: React.createElement('button', { type: 'button' }, 'Join'),
  });

  assert.match(html, /^<article/);
  assert.match(html, /rounded-2xl bg-tennis-surface\/30 p-4/);
  assert.match(html, /<footer class="[^"]*border-t border-fg\/5 pt-3/);
  assert.match(html, /June 15/);
  assert.match(html, />Join</);
  assert.equal((html.match(/border-t border-fg\/5/g) || []).length, 1);
});

test('EntityCard mutes retired entities and keeps media beside badges', () => {
  const html = renderCard({
    muted: true,
    media: React.createElement('img', { alt: 'Racquet' }),
    badges: React.createElement('span', null, 'For sale'),
  });

  assert.match(html, /opacity-55/);
  assert.match(html, /alt="Racquet"/);
  assert.match(html, />For sale</);
  assert.doesNotMatch(html, /<footer/);
});

test('live footer cards consume EntityCard slots instead of copying the footer', async () => {
  const events = await readFile(new URL('../../src/features/events/EventsElements.tsx', import.meta.url), 'utf8');
  const marketplace = await readFile(
    new URL('../../src/pages/marketplace/MarketplaceElements.tsx', import.meta.url),
    'utf8',
  );
  const services = await readFile(new URL('../../src/pages/services/ServicesElements.tsx', import.meta.url), 'utf8');

  assert.match(events, /from '\.\.\/\.\.\/components\/EntityCard'/);
  assert.match(events, /<EntityCard/);

  assert.match(marketplace, /from '\.\.\/\.\.\/components\/EntityCard'/);
  assert.match(marketplace, /footerMeta=/);
  assert.match(marketplace, /footerAction=/);
  assert.doesNotMatch(marketplace, /border-t border-fg\/5/);

  assert.match(services, /from '\.\.\/\.\.\/components\/EntityCard'/);
  assert.match(services, /const OfferCard/);
  assert.match(services, /const CouponCard/);
  assert.equal((services.match(/footerMeta=/g) || []).length, 2);
  assert.match(services, /footerAction=/);
  assert.doesNotMatch(services, /border-t border-fg\/5/);
  assert.doesNotMatch(services, /rounded-2xl bg-clay\/\[0\.08\] border border-clay\/45 p-4/);
});

test('GroupLessonCard is gone; four of the original five cards remain on EntityCard', async () => {
  await assert.rejects(
    () => access(new URL('../../src/pages/services/GroupLessonCard.tsx', import.meta.url), constants.F_OK),
    { code: 'ENOENT' },
  );

  const entityCard = await readFile(new URL('../../src/components/EntityCard.tsx', import.meta.url), 'utf8');
  assert.match(entityCard, /footer className="[^"]*border-t border-fg\/5 pt-3/);
});

test('EntityCard is registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"EntityCard": "src\/components\/EntityCard\.tsx"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /EntityCard: \(\{ theme \}/);
  assert.match(entry, /footerMeta=/);
  assert.match(entry, /footerAction=/);
});
