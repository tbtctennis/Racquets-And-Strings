import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  COURTS_RULE,
  isNameValid,
  LEAGUE_RULE,
  SKILL_RULE,
  validateCompletion,
  validatePassword,
} from '../../src/features/signup/signupForm.ts';
import { buildSignupProfileDocuments } from '../../src/features/signup/signupProfileDocuments.ts';

const validCompletion = {
  name: 'Anuj Raja',
  phone: '',
  skillLevel: 3,
  league: "Men's",
  preferredCourts: ['Stanley Park South - Toronto'],
};

test('signup password validation preserves length, sequential, and confirmation rules', () => {
  assert.deepEqual(validatePassword('abc', 'abc'), {
    password: 'Use 6 to 80 characters. Avoid a simple run like 123456 or abcdef.',
  });
  assert.deepEqual(validatePassword('safe-pass', 'different'), { confirmPassword: 'Passwords do not match' });
  assert.deepEqual(validatePassword('secure-pass', 'secure-pass'), {});
});

test('signup completion validation treats phone as optional but validates supplied digits', () => {
  assert.deepEqual(validateCompletion(validCompletion), {});
  assert.deepEqual(validateCompletion({ ...validCompletion, name: 'A1', phone: '123' }), {
    name: 'Name must be 3–80 characters, with no numbers.',
    phone: 'Phone number must be exactly 10 digits',
  });
  assert.equal(isNameValid(' Anuj Raja '), true);
  assert.equal(isNameValid('A1'), false);
});

test('signup completion requires league, preferred courts, and an explicit skill choice', () => {
  assert.deepEqual(validateCompletion({ ...validCompletion, skillLevel: null, league: '', preferredCourts: [] }), {
    skillLevel: SKILL_RULE,
    league: LEAGUE_RULE,
    preferredCourts: COURTS_RULE,
  });
  assert.deepEqual(validateCompletion({ ...validCompletion, skillLevel: 2 }), {});
  assert.equal(validateCompletion({ ...validCompletion, skillLevel: null }).skillLevel, SKILL_RULE);
  assert.equal('skillLevel' in validateCompletion({ ...validCompletion, skillLevel: 2 }), false);
});

test('signup profile projections preserve league semantics and keep private contact fields separate', () => {
  const docs = buildSignupProfileDocuments(
    {
      uid: 'member-a',
      email: 'member@example.com',
      name: 'Member A',
      phone: '(416)-555-0101',
      skillLevel: 4,
      league: "Women's",
      retiredPro: true,
      juniors: false,
      preferredCourts: ['Court A'],
      preferredZone: 'Downtown - Midtown',
      schedulingPreference: 'Tell me more about matchdays',
    },
    '2026-08-19T00:00:00.000Z',
  );
  assert.deepEqual(docs.user, { name: 'Member A' });
  assert.equal(docs.stats.league, "Women's Retired Pro");
  assert.equal(docs.stats.skill_level, 4);
  assert.equal(docs.contact.email, 'member@example.com');
  assert.equal('email' in docs.user, false);
  assert.equal('event_creator' in docs.preferences, false);
});

test('explicit skill 2.0 is stored as 2; unanswered skill is not a profile projection', () => {
  const docs = buildSignupProfileDocuments(
    {
      uid: 'member-b',
      email: 'b@example.com',
      name: 'Member B',
      phone: '',
      skillLevel: 2,
      league: "Men's",
      retiredPro: false,
      juniors: false,
      preferredCourts: ['Court B'],
      preferredZone: 'Downtown - Midtown',
      schedulingPreference: 'I will schedule matches on my own',
    },
    '2026-08-19T00:00:00.000Z',
  );
  assert.equal(docs.stats.skill_level, 2);
  assert.equal(docs.stats.league, "Men's");
  assert.deepEqual(docs.preferences.preferred_courts, ['Court B']);
});

test('signup route does not report completion when profile persistence fails', async () => {
  const source = await readFile(new URL('../../src/pages/Signup.tsx', import.meta.url), 'utf8');
  assert.match(source, /We could not save your profile\. Please try again; your entries are still here\./);
  assert.doesNotMatch(source, /catch[\s\S]{0,500}setPhase\(['"]done['"]\)/);
});

test('signup does not preselect skill 2.0 as an unanswered default', async () => {
  const source = await readFile(new URL('../../src/pages/Signup.tsx', import.meta.url), 'utf8');
  assert.match(source, /skillLevel:\s*null/);
  assert.doesNotMatch(source, /skillLevel:\s*2\b/);
  assert.match(source, /if \(formData\.skillLevel == null/);
});

test('signup email lookup failures do not bypass the pre-auth abuse boundary', async () => {
  const validation = await readFile(new URL('../../src/features/signup/signupValidation.ts', import.meta.url), 'utf8');
  const route = await readFile(new URL('../../src/pages/Signup.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(validation, /catch[\s\S]{0,160}exists:\s*false/);
  assert.match(route, /We could not securely verify this email\. Please try again\./);
  assert.doesNotMatch(route, /Fail open/);
});
