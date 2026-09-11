import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PersonPairRow } from '../../src/components/PersonPairRow.tsx';
import { PersonRow, seedForUid, seedNumber } from '../../src/components/PersonRow.tsx';
import { MatchCard } from '../../src/pages/tournament/MatchCard.tsx';

const render = (node) => renderToStaticMarkup(React.createElement(MemoryRouter, null, node));

const match = {
  id: 'm1',
  event_id: 'e1',
  tournament_choice: 'Singles',
  division: "Men's",
  skill_group: 'Challengers',
  drawsize: 8,
  match_id: 'QF-1',
  round: 'QF',
  position: 1,
  player_1_slot: 1,
  player_2_slot: 8,
  player_1_name: 'Ada Lovelace',
  player_1_uid: 'u1',
  player_2_name: 'Grace Hopper',
  player_2_uid: 'u2',
  status: 'pending',
  started: false,
};

const players = [
  { uid: 'u1', name: 'Ada Lovelace', participantId: 'p1', seed: 1 },
  { uid: 'u2', name: 'Grace Hopper', participantId: 'p2' },
];

test('seedNumber keeps positive integers and drops zero, missing, and invalid values', () => {
  assert.equal(seedNumber(1), 1);
  assert.equal(seedNumber(10), 10);
  assert.equal(seedNumber(0), undefined);
  assert.equal(seedNumber(-1), undefined);
  assert.equal(seedNumber(1.5), undefined);
  assert.equal(seedNumber(undefined), undefined);
});

test('seedForUid resolves a draw player seed and ignores empty uids', () => {
  assert.equal(seedForUid('u1', players), 1);
  assert.equal(seedForUid('u2', players), undefined);
  assert.equal(seedForUid('', players), undefined);
  assert.equal(seedForUid('u1', [{ uid: 'u1', seed: 0 }]), undefined);
});

test('MatchCard renders a seed before the name and omits unseeded and zero seeds', () => {
  const html = render(
    React.createElement(MatchCard, {
      match: { ...match, player_2_uid: 'u3' },
      variant: 'stack',
      isFinal: false,
      players: [...players, { uid: 'u3', name: 'Zero Seed', participantId: 'p3', seed: 0 }],
    }),
  );

  assert.match(html, /aria-label="Seed 1"/);
  assert.match(html, /\(1\)/);
  assert.match(html, /Ada Lovelace/);
  assert.match(html, /Grace Hopper/);
  assert.doesNotMatch(html, /Seed 0|\(0\)/);
  assert.doesNotMatch(html, /Seed 8|\(8\)/);
});

test('PersonPairRow draw-list rows show a seed per player without adding a third stat', () => {
  const html = render(
    React.createElement(PersonPairRow, {
      player1: { uid: 'u1', name: 'Ada Lovelace', seed: 1 },
      player2: { uid: 'u2', name: 'Grace Hopper', seed: 0 },
      action: React.createElement('span', null, '12 pts'),
    }),
  );

  assert.match(html, /aria-label="Seed 1"/);
  assert.match(html, />Ada L</);
  assert.match(html, />Grace H</);
  assert.doesNotMatch(html, /Seed 0|\(0\)/);
  assert.match(html, /w-\[78px\][^"]*shrink-0/);
  assert.match(html, /min-w-\[40%\]/);
});

test('PersonRow seed occupies one of the two stats and leaves the 78px action slot', () => {
  const html = renderToStaticMarkup(
    React.createElement(PersonRow, {
      name: 'Ada Lovelace',
      seed: 1,
      density: 'compact',
      action: React.createElement('span', null, '12 Group Pts'),
    }),
  );

  assert.match(html, /aria-label="Seed 1"/);
  assert.match(html, /\(1\)/);
  assert.match(html, /12 Group Pts/);
  assert.match(html, /w-\[78px\] shrink-0/);
  assert.match(html, /min-w-\[40%\]/);
  assert.match(html, /truncate whitespace-nowrap text-sm/);
  assert.doesNotMatch(html, /\(0\)/);
});

test('RR standings pass seed into PersonRow and drop rank when the badge is present', async () => {
  const source = await readFile(new URL('../../src/pages/tournament/RRGroupCard.tsx', import.meta.url), 'utf8');
  const standingsBlock = source.slice(
    source.indexOf('{standings.length > 0'),
    source.indexOf('Tap a player to contact'),
  );

  assert.match(standingsBlock, /seed=\{seed\}/);
  assert.match(standingsBlock, /seed === undefined && \(/);
  assert.match(standingsBlock, /\{row\.rank\}/);
  assert.match(source, /seed=\{p\.seed\}/);
  assert.match(source, /seed: seedForUid\(m\.player_1_uid, players\)/);
});

test('the knockout draw passes the player list into bracket MatchCards', async () => {
  const page = await readFile(new URL('../../src/pages/Tournament.tsx', import.meta.url), 'utf8');
  const bracket = await readFile(new URL('../../src/pages/tournament/BracketView.tsx', import.meta.url), 'utf8');
  const accordion = await readFile(new URL('../../src/pages/tournament/BracketAccordion.tsx', import.meta.url), 'utf8');

  assert.match(page, /players=\{currentDrawAllPlayers\}/);
  assert.match(page, /drawPlayers=\{currentDrawAllPlayers\}/);
  assert.match(bracket, /players=\{players\}/);
  assert.match(accordion, /players=\{players\}/);
});
