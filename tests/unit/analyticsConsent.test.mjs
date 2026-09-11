import assert from 'node:assert/strict';
import { test } from 'node:test';

const store = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  },
});

const { track } = await import('../../src/lib/analytics.ts');
const { getAnalyticsConsent, hasAnalyticsConsent, setAnalyticsConsent } =
  await import('../../src/lib/analyticsConsent.ts');

test('track() no-ops without consent', async () => {
  assert.equal(getAnalyticsConsent(), null);
  assert.equal(hasAnalyticsConsent(), false);

  // Without the consent gate this would import firebase.ts and throw
  // "Firebase configuration is incomplete".
  await track('page_view', { page_path: '/' });

  setAnalyticsConsent(false);
  assert.equal(getAnalyticsConsent(), 'denied');
  assert.equal(hasAnalyticsConsent(), false);
  assert.equal(store.get('rs-analytics-consent'), 'denied');
  await track('login', { method: 'email' });
});
