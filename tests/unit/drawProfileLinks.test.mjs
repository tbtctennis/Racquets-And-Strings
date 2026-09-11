import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PersonPairRow } from '../../src/components/PersonPairRow.tsx';
import { PersonRow } from '../../src/components/PersonRow.tsx';
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
  player_2_name: 'BYE',
  player_2_uid: '',
  status: 'pending',
  started: false,
};

test('MatchCard names link to member profiles only when a uid exists', () => {
  const html = render(
    React.createElement(MatchCard, {
      match,
      variant: 'stack',
      isFinal: false,
    }),
  );

  assert.match(html, /href="\/players\/u1"/);
  assert.match(html, />Ada Lovelace</);
  assert.match(html, />BYE</);
  assert.doesNotMatch(html, /href="\/players\/u2"|href="\/players\/"$/);
  assert.equal((html.match(/href="\/players\//g) || []).length, 1);
});

test('MatchCard winner name links when the winner uid exists', () => {
  const html = render(
    React.createElement(MatchCard, {
      match: {
        ...match,
        player_2_name: 'Grace Hopper',
        player_2_uid: 'u2',
        winner_uid: 'u1',
        winner_name: 'Ada Lovelace',
        status: 'complete',
      },
      variant: 'grid',
      isFinal: true,
    }),
  );

  assert.match(html, /Winner:/);
  assert.equal((html.match(/href="\/players\/u1"/g) || []).length, 2);
  assert.match(html, /href="\/players\/u2"/);
});

test('PersonPairRow draw names link only for members with a uid', () => {
  const html = render(
    React.createElement(PersonPairRow, {
      player1: { uid: 'one', name: 'blake bell' },
      player2: { name: 'BYE' },
    }),
  );

  assert.match(html, /href="\/players\/one"/);
  assert.match(html, />Blake B</);
  assert.match(html, />BYE</);
  assert.equal((html.match(/href="\/players\//g) || []).length, 1);
});

test('PersonRow draw names link when nameHref is a real profile path', () => {
  const linked = render(React.createElement(PersonRow, { name: 'Ada Lovelace', nameHref: '/players/u1' }));
  const plain = render(React.createElement(PersonRow, { name: 'BYE' }));

  assert.match(linked, /href="\/players\/u1"/);
  assert.match(linked, />Ada L</);
  assert.doesNotMatch(plain, /href="\/players\//);
  assert.match(plain, />BYE</);
});

test('knockout and RR draws wire participant names through the profile href helper', async () => {
  const matchCard = await readFile(new URL('../../src/pages/tournament/MatchCard.tsx', import.meta.url), 'utf8');
  const pair = await readFile(new URL('../../src/components/PersonPairRow.tsx', import.meta.url), 'utf8');
  const rr = await readFile(new URL('../../src/pages/tournament/RRGroupCard.tsx', import.meta.url), 'utf8');

  assert.match(matchCard, /memberProfileHref\(uid\)/);
  assert.match(matchCard, /memberProfileHref\(match\.winner_uid\)/);
  assert.match(pair, /memberProfileHref\(player1\.uid\)/);
  assert.match(pair, /memberProfileHref\(player2\.uid\)/);
  assert.match(rr, /nameHref=\{memberProfileHref\(row\.userId\)\}/);
  assert.match(rr, /nameHref=\{memberProfileHref\(p\.uid\)\}/);
});
