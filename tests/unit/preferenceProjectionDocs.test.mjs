import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const load = (relativePath) => readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('preference projection contract records consent, event scope, allowed fields, revocation, and Rules tests', async () => {
  const contract = await load('docs/domain/PREFERENCE_PROJECTION.md');
  const rules = await load('firestore.rules');

  assert.match(contract, /^## Consent/m);
  assert.match(contract, /^## Event scope/m);
  assert.match(contract, /^## Allowed fields/m);
  assert.match(contract, /^## Revocation/m);
  assert.match(contract, /^## Fail closed/m);
  assert.match(contract, /consented: true/);
  assert.match(contract, /events\/\{eventId\}\/preference_projections\/\{uid\}/);
  assert.match(contract, /availability_tags/);
  assert.match(contract, /preferred_courts/);
  assert.match(contract, /email_notifications/);
  assert.match(contract, /event_creator/);
  assert.match(contract, /consented: false/);
  assert.match(contract, /tests\/rules\/firestore\.preferenceProjection\.test\.mjs/);
  assert.match(contract, /public_preferences/);

  assert.match(rules, /match \/events\/\{eventId\}\/preference_projections\/\{userId\}/);
  assert.match(rules, /canReadEventPreferenceProjection/);
  assert.match(rules, /match \/public_preferences\/\{userId\}/);
});
