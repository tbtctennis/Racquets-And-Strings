import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('organizer_ids changes are callable-owned and audited', async () => {
  const callable = await load('../../functions/organizerAssignment.js');
  const lib = await load('../../functions/lib/organizerAssignment.js');
  const rules = await load('../../firestore.rules');

  assert.match(callable, /exports.assignEventOrganizers/);
  assert.match(lib, /ORGANIZER_ASSIGNMENT_AUDIT_COLLECTION = 'organizer_assignment_audit'/);
  assert.match(lib, /actor_uid/);
  assert.match(lib, /target_uids/);
  assert.match(lib, /before/);
  assert.match(lib, /after/);
  assert.match(lib, /created_at/);
  assert.match(rules, /match \/organizer_assignment_audit\/\{id\}/);
  assert.match(rules, /'organizer_ids', 'assigned_organizer_uids', 'organizer_uids'/);
});
