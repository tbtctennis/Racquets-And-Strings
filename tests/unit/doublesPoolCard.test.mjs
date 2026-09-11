import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DoublesPoolCard } from '../../src/features/partnerPool/DoublesPoolCard.tsx';
import {
  DOUBLES_POOL_STAT_LABELS,
  doublesWinsFor,
  numberPartners,
  partnersFor,
} from '../../src/features/partnerPool/doublesPoolStats.ts';

const values = {
  wins: 4,
  pgWonPct: '48%',
  partners: ['blake bell', 'Annas Tariq'],
  availabilityTags: ['weekday_evenings'],
  nearby: true,
};

const renderCard = (props = {}) =>
  renderToStaticMarkup(
    React.createElement(DoublesPoolCard, {
      id: 'u1',
      name: 'ava stone',
      open: true,
      onToggle() {},
      values,
      ...props,
    }),
  );

test('the doubles pool card carries exactly the five ruled stats', () => {
  assert.deepEqual([...DOUBLES_POOL_STAT_LABELS], ['Wins', 'P/G Won %', 'Partners', 'Availability', 'Nearby']);
  assert.equal(DOUBLES_POOL_STAT_LABELS.length, 5);

  const html = renderCard();
  assert.match(html, /data-stat-count="5"/);
  assert.match(html, />Wins</);
  assert.match(html, />4</);
  assert.match(html, />P\/G Won %</);
  assert.match(html, />48%</);
  assert.match(html, />Partners</);
  assert.match(html, /1\. Blake Bell · 2\. Annas Tariq/);
  assert.match(html, />Availability</);
  assert.match(html, /Weekday Evenings/);
  assert.match(html, />Nearby</);
  assert.doesNotMatch(html, /Rank Move|Matches Played|Streak|P\/G Played|Group Pts|Skill 3/);
});

test('the doubles pool card reuses PlayerCard and does not add a sixth stat', () => {
  const extra = { ...values, streak: '2W', rankMove: 3 };
  const html = renderCard({ values: extra, subtitle: 'Skill 3.5' });
  assert.match(html, /data-stat-count="5"/);
  assert.match(html, /id="player-card-u1"/);
  assert.match(html, /sm:grid-cols-2/);
  assert.match(html, /Skill 3\.5/);
  for (const label of DOUBLES_POOL_STAT_LABELS) {
    assert.match(html, new RegExp(label.replace(/[/%]/g, '\\$&')));
  }
  assert.doesNotMatch(html, />2W</);
  assert.doesNotMatch(html, />3</);
});

test('partners are numbered 1, 2, 3 and wins count doubles results for captain or partner', () => {
  assert.equal(numberPartners([]), '—');
  assert.equal(numberPartners(['Ava Stone', 'Blake Bell']), '1. Ava Stone · 2. Blake Bell');

  const participants = [
    { uid: 'ava', eventId: 'e1', partnerUid: 'blake', partnerName: 'blake bell', tournamentChoice: 'Doubles' },
    { uid: 'ava', eventId: 'e2', partnerUid: 'annas', partnerName: 'Annas Tariq', tournamentChoice: 'Doubles' },
    { uid: 'other', eventId: 'e3', userName: 'Casey Cole', partnerUid: 'ava', tournamentChoice: 'Doubles' },
  ];
  assert.deepEqual(partnersFor('ava', participants), ['Blake Bell', 'Annas Tariq', 'Casey Cole']);

  const matches = [
    {
      eventId: 'e1',
      player1Uid: 'ava',
      player2Uid: 'opp',
      winnerUid: 'ava',
      status: 'complete',
      category: 'doubles',
    },
    {
      eventId: 'e3',
      player1Uid: 'other',
      player2Uid: 'opp2',
      winnerUid: 'other',
      status: 'complete',
      tournamentChoice: 'Doubles',
    },
    {
      eventId: 'e1',
      player1Uid: 'ava',
      player2Uid: 'opp3',
      winnerUid: 'opp3',
      status: 'complete',
      category: 'singles',
    },
  ];
  assert.equal(doublesWinsFor('ava', matches, participants), 2);
});

test('the partner pool panel consumes DoublesPoolCard on PlayerCard, not a third profile stack', async () => {
  const panel = await readFile(new URL('../../src/features/partnerPool/PartnerPoolPanel.tsx', import.meta.url), 'utf8');
  const card = await readFile(new URL('../../src/features/partnerPool/DoublesPoolCard.tsx', import.meta.url), 'utf8');

  assert.match(panel, /from '\.\/DoublesPoolCard'/);
  assert.match(panel, /<DoublesPoolCard/);
  assert.doesNotMatch(panel, /PersonRow|ProfileCard|EntityCard/);
  assert.match(card, /from '\.\.\/\.\.\/components\/PlayerCard'/);
  assert.match(card, /<PlayerCard/);
  assert.doesNotMatch(card, /ProfileCard|EntityCard|StatTile/);
});
