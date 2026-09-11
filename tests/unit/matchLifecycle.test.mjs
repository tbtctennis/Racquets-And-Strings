import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  declinedSenderUids,
  findCancellableMatch,
  isCancellableMatch,
} from '../../src/features/matches/matchLifecycle.ts';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

const declinedRally = {
  id: 'rally-declined',
  status: 'declined',
  player_1_uid: 'alex',
  player_2_uid: 'me',
};
const openRally = {
  id: 'rally-open',
  status: 'open',
  player_1_uid: 'me',
  player_2_uid: 'sam',
};
const acceptedRally = {
  id: 'rally-accepted',
  status: 'accepted',
  player_1_uid: 'me',
  player_2_uid: 'pat',
};
const acceptedIncoming = {
  id: 'rally-accepted-in',
  status: 'accepted',
  player_1_uid: 'jordan',
  player_2_uid: 'me',
};

test('a declined request stays hidden for the rejecting player after reload', () => {
  const hidden = declinedSenderUids([declinedRally, openRally, acceptedRally], 'me');
  assert.deepEqual([...hidden], ['alex']);
  assert.equal(hidden.has('alex'), true);
  assert.equal(hidden.has('sam'), false);
  assert.equal(declinedSenderUids([declinedRally], 'alex').size, 0);
});

test('cancel after acceptance is allowed for either player; open retracts stay sender-only', () => {
  assert.equal(isCancellableMatch(openRally, 'me'), true);
  assert.equal(isCancellableMatch(openRally, 'sam'), false);
  assert.equal(isCancellableMatch(acceptedRally, 'me'), true);
  assert.equal(isCancellableMatch(acceptedRally, 'pat'), true);
  assert.equal(isCancellableMatch(acceptedIncoming, 'me'), true);
  assert.equal(isCancellableMatch({ ...acceptedRally, status: 'complete' }, 'me'), false);
  assert.equal(isCancellableMatch({ ...acceptedRally, status: 'declined' }, 'me'), false);

  const items = [openRally, acceptedRally, acceptedIncoming, declinedRally];
  assert.equal(findCancellableMatch(items, 'me', 'pat')?.id, 'rally-accepted');
  assert.equal(findCancellableMatch(items, 'me', 'jordan')?.id, 'rally-accepted-in');
  assert.equal(findCancellableMatch(items, 'me', 'alex'), undefined);
});

test('Matches hides declined senders and cancels accepted matches through the callable', async () => {
  const matches = await load('../../src/pages/Matches.tsx');
  const ladder = await load('../../src/features/leagues/ladderService.ts');
  const rallies = await load('../../src/features/rallies/rallyService.ts');

  assert.match(matches, /declinedSenderUids/);
  assert.match(matches, /findCancellableMatch/);
  assert.match(matches, /!incomingReq && \(isPending \|\| showContact\)/);
  assert.match(ladder, /cancelMatch/);
  assert.match(rallies, /cancelMatch/);
  assert.match(ladder, /status: accept \? 'accepted' : 'declined'/);
  assert.match(rallies, /status: accept \? 'accepted' : 'declined'/);
});
