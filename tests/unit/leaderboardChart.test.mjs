import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LeaderboardChart } from '../../src/features/leagues/LeaderboardChart.tsx';
import {
  lastFiveProgressPoints,
  pgWonLabel,
  rankLabel,
  rankSnapshotsFromEntries,
} from '../../src/features/leagues/leaderboardChart.ts';

const match = (completedAt, myGames, oppGames) => ({ completedAt, myGames, oppGames });

const circleCy = (html, series, index) => {
  const tag = html.match(new RegExp(`<circle data-series="${series}" data-index="${index}"[^>]*(?:/>|>)`));
  assert.ok(tag, `missing ${series} circle ${index}`);
  const value = tag[0].match(/cy="([^"]*)"/);
  assert.ok(value, `missing cy on ${series} ${index}`);
  return Number(value[1]);
};

const texts = (html) => [...html.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((row) => row[1]);

test('lastFiveProgressPoints caps at five and keeps career P/G', () => {
  const matches = [
    match(1, 6, 4),
    match(2, 6, 4),
    match(3, 0, 6),
    match(4, 6, 3),
    match(5, 4, 6),
    match(6, 6, 2),
    match(7, 3, 6),
  ];
  const points = lastFiveProgressPoints(matches, 23);

  assert.equal(points.length, 5);
  assert.equal(lastFiveProgressPoints(matches.slice(0, 1), 23).length, 1);
  assert.deepEqual(lastFiveProgressPoints([], 23), []);

  const won = 6 + 6 + 0 + 6 + 4 + 6 + 3;
  const played = won + (4 + 4 + 6 + 3 + 6 + 2 + 6);
  assert.equal(points[4].pgWonPct, (won / played) * 100);
  assert.equal(points[4].rank, 23);
});

test('rank snapshots fill earlier points; the last point stays on the live rank', () => {
  const matches = [match(10, 6, 4), match(20, 4, 6), match(30, 6, 3)];
  const history = rankSnapshotsFromEntries([
    { date: '1970-01-01T00:00:00.010Z', position: 40 },
    { date: '1970-01-01T00:00:00.025Z', position: 31 },
  ]);
  const points = lastFiveProgressPoints(matches, 23, history);

  assert.deepEqual(
    points.map((p) => p.rank),
    [40, 40, 23],
  );
  assert.equal(pgWonLabel(48.2), '48% P/G won');
  assert.equal(rankLabel(23), 'rank #23');
});

test('chart annotations, inverted rank, 360px middle labels, one point, empty state', () => {
  const five = renderToStaticMarkup(
    React.createElement(LeaderboardChart, {
      points: [
        { pgWonPct: 40, rank: 23 },
        { pgWonPct: 44, rank: 18 },
        { pgWonPct: 46, rank: 12 },
        { pgWonPct: 47, rank: 8 },
        { pgWonPct: 48, rank: 1 },
      ],
    }),
  );
  const extra = renderToStaticMarkup(
    React.createElement(LeaderboardChart, {
      points: [
        { pgWonPct: 10, rank: 50 },
        { pgWonPct: 40, rank: 23 },
        { pgWonPct: 44, rank: 18 },
        { pgWonPct: 46, rank: 12 },
        { pgWonPct: 47, rank: 8 },
        { pgWonPct: 48, rank: 1 },
      ],
    }),
  );
  const one = renderToStaticMarkup(React.createElement(LeaderboardChart, { points: [{ pgWonPct: 48, rank: 23 }] }));
  const empty = renderToStaticMarkup(React.createElement(LeaderboardChart, { points: [] }));

  assert.equal(texts(five).filter((t) => t.includes('P/G won')).length, 5);
  assert.equal(texts(five).filter((t) => t.startsWith('rank #')).length, 5);
  assert.match(five, /48% P\/G won/);
  assert.match(five, /rank #23/);
  assert.equal(texts(five).filter((t) => !t.includes('P/G won') && !t.startsWith('rank #')).length, 0);
  assert.equal((five.match(/data-series="pg" data-index=/g) || []).length, 10);
  assert.equal((extra.match(/data-series="rank" data-index="5"/g) || []).length, 0);

  const rankTop = circleCy(five, 'rank', 4);
  const rankBottom = circleCy(five, 'rank', 0);
  assert.ok(rankTop < rankBottom, `rank 1 (${rankTop}) should sit above rank 23 (${rankBottom})`);

  const midLabel = five.match(/data-edge="false"[^>]*class="([^"]*)"/);
  const edgeLabel = five.match(/data-edge="true"[^>]*class="([^"]*)"/);
  assert.ok(midLabel && edgeLabel, 'missing edge flags on labels');
  assert.match(midLabel[1], /max-\[360px\]:hidden/);
  assert.doesNotMatch(edgeLabel[1], /max-\[360px\]:hidden/);

  assert.match(one, /48% P\/G won/);
  assert.match(one, /rank #23/);
  assert.match(one, /<circle/);
  assert.doesNotMatch(one, /<path/);

  assert.match(empty, /No matches yet/);
  assert.doesNotMatch(empty, /<svg/);
  assert.doesNotMatch(empty, /<path/);
  assert.doesNotMatch(empty, /<line/);
  assert.doesNotMatch(empty, /<circle/);
});

test('leaderboard progress uses the last-five annotated chart', async () => {
  const leagues = await readFile(new URL('../../src/pages/Leagues.tsx', import.meta.url), 'utf8');
  const chart = await readFile(new URL('../../src/features/leagues/LeaderboardChart.tsx', import.meta.url), 'utf8');

  assert.match(leagues, /lastFiveProgressPoints\(userMatches, liveRank, rankHistory\)/);
  assert.match(leagues, /<LeaderboardChart points=\{chartPoints\}/);
  assert.doesNotMatch(leagues, /winPctSeries/);
  assert.doesNotMatch(leagues, /Not enough matches yet/);
  assert.doesNotMatch(chart, /preserveAspectRatio="none"/);
});
