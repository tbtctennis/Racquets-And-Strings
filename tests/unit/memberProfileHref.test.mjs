import assert from 'node:assert/strict';
import { test } from 'node:test';
import { memberProfileHref } from '../../src/features/members/memberProfileHref.ts';

test('memberProfileHref links only real member uids', () => {
  assert.equal(memberProfileHref('u1'), '/players/u1');
  assert.equal(memberProfileHref('  u2  '), '/players/u2');
});

test('memberProfileHref withholds restricted and placeholder slots', () => {
  assert.equal(memberProfileHref(undefined), undefined);
  assert.equal(memberProfileHref(null), undefined);
  assert.equal(memberProfileHref(''), undefined);
  assert.equal(memberProfileHref('   '), undefined);
  assert.equal(memberProfileHref('__player_loading__'), undefined);
  assert.equal(memberProfileHref('__loading_123'), undefined);
});
