import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { SHARED_DRAW_CONSENT } from '../../src/features/signup/sharedDrawConsent.ts';

test('signup and event join import the same shared-draw consent sentence', async () => {
  const signup = await readFile(new URL('../../src/pages/Signup.tsx', import.meta.url), 'utf8');
  const join = await readFile(new URL('../../src/features/events/EventsElements.tsx', import.meta.url), 'utf8');

  assert.equal(SHARED_DRAW_CONSENT, 'A shared draw includes your contact details so other participants can reach you.');
  assert.match(signup, /SHARED_DRAW_CONSENT/);
  assert.match(join, /SHARED_DRAW_CONSENT/);
  assert.match(signup, /from ['"]\.\.\/features\/signup\/sharedDrawConsent['"]/);
  assert.match(join, /from ['"]\.\.\/signup\/sharedDrawConsent['"]/);
});
