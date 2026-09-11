import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { CHALLENGE_BLOCK_LABEL, challengeBlockReason } from '../../src/features/leagues/challengeRules.ts';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const opponent = { user_id: 'opp' };
const open = {
  userId: 'me',
  ready: true,
  myDivision: 'mens',
  hasLadder: true,
  hasConflict: false,
  state: 'available',
  activeChallengesLeft: 3,
};

test('challengeBlockReason maps each block to the label shown in the Challenges tab', () => {
  assert.equal(challengeBlockReason(opponent, open), null);

  const cases = [
    [{ ...open, userId: null }, 'self'],
    [{ ...open }, 'self', { user_id: 'me' }],
    [{ ...open, supported: false }, 'unsupported'],
    [{ ...open, ready: false }, 'not-ready'],
    [{ ...open, myDivision: null }, 'not-ready'],
    [{ ...open, hasLadder: false }, 'no-ladder'],
    [{ ...open, otherDivision: true }, 'other-division'],
    [{ ...open, hasConflict: true }, 'conflict'],
    [{ ...open, state: 'pending' }, 'pending'],
    [{ ...open, state: 'cooldown' }, 'cooldown'],
    [{ ...open, activeChallengesLeft: 0 }, 'active-limit'],
  ];

  for (const [ctx, reason, who] of cases) {
    assert.equal(challengeBlockReason(who ?? opponent, ctx), reason);
    assert.equal(typeof CHALLENGE_BLOCK_LABEL[reason], 'string');
    assert.ok(CHALLENGE_BLOCK_LABEL[reason].length > 0);
  }
});

test('Challenges tab is the surviving send entry and shows blocked reasons', async () => {
  const matches = await load('../../src/pages/Matches.tsx');
  const leagues = stripComments(await load('../../src/pages/Leagues.tsx'));
  const home = stripComments(await load('../../src/pages/Home.tsx'));
  const events = await load('../../src/features/events/EventsElements.tsx');

  assert.match(matches, /challengeBlockReason\(p,/);
  assert.match(matches, /CHALLENGE_BLOCK_LABEL\[blockedReason\]/);
  assert.match(matches, /CHALLENGE_BLOCK_LABEL\['no-ladder'\]/);
  assert.match(matches, /CHALLENGE_BLOCK_LABEL\['not-ready'\]/);
  assert.match(matches, /createChallenge\(/);
  assert.match(matches, /\{ value: 'challenges', label: 'Challenges' \}/);
  assert.match(matches, /\{blockLabel\}/);

  assert.doesNotMatch(leagues, /createChallenge/);
  assert.doesNotMatch(leagues, /useChallengeRules/);
  assert.doesNotMatch(leagues, />\s*Challenge\s*</);
  assert.doesNotMatch(home, /createChallenge/);
  assert.doesNotMatch(home, />\s*Challenge(\sNow)?\s*</);

  assert.match(events, /navigate\(isLoggedIn \? '\/matches\?mode=challenges' : '\/login'\)/);
  assert.doesNotMatch(events, /createChallenge/);
});
