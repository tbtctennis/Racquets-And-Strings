import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProfileCard } from '../../src/components/ProfileCard.tsx';
import {
  CAMPAIGN_COPY,
  DEFAULT_DONATION_AMOUNT,
  currentSeasonName,
  donationCheckoutUrls,
  parseDonationAmount,
  startDonationCheckout,
} from '../../src/features/payments/donateCheckout.ts';

const src = (relative) => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('own ProfileCard shows Support the league; public mode does not', () => {
  const own = renderToStaticMarkup(React.createElement(ProfileCard, { mode: 'own', name: 'blake bell' }));
  const pub = renderToStaticMarkup(React.createElement(ProfileCard, { mode: 'public', name: 'blake bell' }));

  assert.match(own, />Support the league</);
  assert.match(own, /data-mode="own"/);
  assert.doesNotMatch(pub, /Support the league/);
});

test('donation surface copy names the current season and hands off through createCheckoutSession', async () => {
  const surface = await src('src/features/payments/DonationSurface.tsx');
  const profile = await src('src/features/profile/components/ProfileInfo.tsx');
  const card = await src('src/components/ProfileCard.tsx');

  assert.match(surface, /from '\.\.\/\.\.\/components\/Sheet'/);
  assert.match(surface, /from '\.\.\/\.\.\/components\/Button'/);
  assert.match(surface, /from '\.\.\/\.\.\/components\/Input'/);
  assert.match(surface, /title="Support the league"/);
  assert.match(surface, /CAMPAIGN_COPY/);
  assert.match(surface, /currentSeasonName/);
  assert.match(surface, /createCheckoutSession/);
  assert.match(surface, /startDonationCheckout/);
  assert.doesNotMatch(surface, /<select[\s>]/);
  assert.doesNotMatch(surface, /card_number|cvc|sk_test|sk_live|VITE_STRIPE/);

  assert.match(profile, /onSupportLeague=\{\(\) => setShowDonateSheet\(true\)\}/);
  assert.match(profile, /<DonationSurface onClose=\{\(\) => setShowDonateSheet\(false\)\}/);
  assert.match(card, /<Button type="button" className="w-full" onClick=\{onSupportLeague\}>/);
  assert.match(card, /Support the league/);
});

test('startDonationCheckout creates a test-mode donation session and assigns the hosted URL', async () => {
  assert.equal(
    CAMPAIGN_COPY,
    'to help us organize more events, provide new tennis balls for matches, get better prizes for winners, and an end of season awards ceremony',
  );
  assert.equal(DEFAULT_DONATION_AMOUNT, 25);
  assert.equal(currentSeasonName('2026-09-11T16:00:00.000Z'), 'Summer');
  assert.equal(currentSeasonName('2026-01-08T15:01:00.000Z'), 'Winter');
  assert.equal(parseDonationAmount('25'), 25);
  assert.equal(parseDonationAmount('0.49'), null);
  assert.deepEqual(donationCheckoutUrls('http://localhost:3000'), {
    success_url: 'http://localhost:3000/profile?donation=success',
    cancel_url: 'http://localhost:3000/profile?donation=cancel',
  });

  const calls = [];
  const assigned = [];
  await startDonationCheckout({
    amount: 25,
    origin: 'http://localhost:3000',
    createSession: async (request) => {
      calls.push(request);
      return { id: 'cs_test_session', url: 'https://checkout.stripe.com/c/pay/cs_test_session' };
    },
    assign: (url) => assigned.push(url),
  });

  assert.deepEqual(calls, [
    {
      amount: 25,
      type: 'donation',
      success_url: 'http://localhost:3000/profile?donation=success',
      cancel_url: 'http://localhost:3000/profile?donation=cancel',
    },
  ]);
  assert.deepEqual(assigned, ['https://checkout.stripe.com/c/pay/cs_test_session']);

  await assert.rejects(
    () =>
      startDonationCheckout({
        amount: 0.25,
        origin: 'http://localhost:3000',
        createSession: async () => {
          throw new Error('should not run');
        },
        assign: () => undefined,
      }),
    /Minimum donation is \$0\.50/,
  );
});
