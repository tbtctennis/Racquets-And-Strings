import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('RR group bonus awards are callable-owned, stamped, and audited', async () => {
  const callable = await load('../../functions/competitionResults.js');
  const lib = await load('../../functions/lib/groupBonus.js');
  const rules = await load('../../firestore.rules');

  assert.match(callable, /exports.setGroupBonus/);
  assert.match(lib, /RR_GROUP_BONUS_AUDIT_COLLECTION = 'rr_group_bonus_audit'/);
  assert.match(lib, /actor_uid/);
  assert.match(lib, /points_delta/);
  assert.match(lib, /rr_groupbonus/);
  assert.match(rules, /match \/rr_group_bonus_audit\/\{id\}/);
  assert.match(rules, /'rr_groupbonus', 'rr_group_bonus_v2'/);
});
