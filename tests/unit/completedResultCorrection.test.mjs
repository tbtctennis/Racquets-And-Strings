import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('completed-result corrections are callable-owned and audited with a reason', async () => {
  const callable = await load('../../functions/completedResultCorrection.js');
  const lib = await load('../../functions/lib/completedResultCorrection.js');
  const rules = await load('../../firestore.rules');
  const client = await load('../../src/features/tournament/services/tournamentResultService.ts');

  assert.match(callable, /exports.correctCompletedResult/);
  assert.match(lib, /COMPLETED_RESULT_AUDIT_COLLECTION = 'tournament_result_audit'/);
  assert.match(lib, /actor_uid/);
  assert.match(lib, /reason/);
  assert.match(lib, /before/);
  assert.match(lib, /after/);
  assert.match(lib, /recorded_at/);
  assert.match(lib, /Only a completed result can be corrected/);
  assert.match(rules, /match \/tournament_result_audit\/\{id\}/);
  assert.match(client, /correctCompletedResult/);
});
