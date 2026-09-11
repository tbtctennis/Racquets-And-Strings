import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildCatalogRewards,
  groupRewardsByCategory,
  sortRedemptionsNewestFirst,
} from '../../src/features/services/catalog.ts';

const reward = (overrides = {}) => ({
  id: 'r1',
  category: 'stringing',
  provider_id: 'shop-a',
  provider_name: 'Alpha',
  area: 'Downtown',
  offer: 'Synthetic',
  discount: 10,
  total_price: 40,
  discounted_price: 30,
  points_cost: 15,
  ...overrides,
});

test('catalog prefers live services, skips inactive rows, and enriches from providers', () => {
  const built = buildCatalogRewards(
    [
      reward({ id: 'inactive', active: false, provider_name: 'Zed' }),
      reward({ id: 'live', provider_name: 'Stale', area: 'Old', uid: 'old-uid', sort: 2 }),
      reward({ id: 'other', provider_id: 'shop-b', provider_name: 'Beta', sort: 1 }),
    ],
    [reward({ id: 'legacy', provider_name: 'Should not appear' })],
    [
      { id: 'shop-a', name: 'Alpha Shop', roles: ['stringer'], member_uid: 'member-a', area: 'Midtown' },
      { id: 'shop-b', name: 'Beta Shop', roles: ['stringer'] },
    ],
  );
  assert.deepEqual(
    built.map((row) => ({ id: row.id, provider_name: row.provider_name, area: row.area, uid: row.uid })),
    [
      { id: 'live', provider_name: 'Alpha Shop', area: 'Midtown', uid: 'member-a' },
      { id: 'other', provider_name: 'Beta Shop', area: 'Downtown', uid: undefined },
    ],
  );
});

test('empty services catalog falls back to legacy task offers', () => {
  const built = buildCatalogRewards([], [reward({ id: 'legacy' })], []);
  assert.deepEqual(
    built.map((row) => row.id),
    ['legacy'],
  );
});

test('presentation grouping is one provider row with every offer in that category', () => {
  const grouped = groupRewardsByCategory([
    reward({ id: 'a1', offer: 'Syn' }),
    reward({ id: 'a2', offer: 'Gut', sort: 2 }),
    reward({ id: 'c1', category: 'coaching', provider_id: 'coach-a', provider_name: 'Pat' }),
  ]);
  const stringing = grouped.get('stringing') ?? [];
  assert.equal(stringing.length, 1);
  assert.deepEqual(
    stringing[0].offers.map((offer) => offer.id),
    ['a1', 'a2'],
  );
  assert.equal((grouped.get('coaching') ?? []).length, 1);
});

test('redemptions sort newest first without mutating the source', () => {
  const source = [
    { code: 'old', created_at: '2026-01-01T00:00:00.000Z' },
    { code: 'new', created_at: '2026-02-01T00:00:00.000Z' },
  ];
  assert.deepEqual(
    sortRedemptionsNewestFirst(source).map((row) => row.code),
    ['new', 'old'],
  );
  assert.equal(source[0].code, 'old');
});
