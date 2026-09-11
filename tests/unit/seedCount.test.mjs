import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seedCount } from '../../src/features/tournament/domain/seeding.ts';

test('seedCount is half the knockout draw, capped at 10', () => {
  assert.equal(seedCount(4), 2);
  assert.equal(seedCount(8), 4);
  assert.equal(seedCount(16), 8);
  assert.equal(seedCount(32), 10);
});
