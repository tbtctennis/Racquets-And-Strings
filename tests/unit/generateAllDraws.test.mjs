import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  generateDrawsSequentially,
  generationMessage,
  generationSummary,
  previewPopulatedDraws,
} from '../../src/features/tournament/domain/generateAllDraws.ts';
import { placeByAnchors } from '../../src/features/tournament/domain/seeding.ts';
import { buildKnockoutDrawPlan } from '../../src/pages/tournament/knockoutGeneration.ts';

const candidate = (label, playerCount, generated = false, drawSize = 8) => ({
  label,
  playerCount,
  generated,
  drawSize,
});

const player = (uid, name = uid) => ({ uid, name, participantId: uid });
const field = (n) => Array.from({ length: n }, (_, i) => player(`p${i + 1}`, `P${i + 1}`));
const draw = {
  tab: 'mens',
  label: "Men's Challengers",
  tournamentChoice: 'Singles',
  division: "Men's",
  skillGroup: 'Challengers',
};

const firstRound = (docs) =>
  docs.filter((doc) => typeof doc.data.player_1_slot === 'number' && typeof doc.data.player_2_slot === 'number');

test('preview lists only populated, ungenerated draws', () => {
  assert.deepEqual(
    previewPopulatedDraws([
      candidate("Men's Beginners", 6, false, 8),
      candidate("Men's Challengers", 0, false, 8),
      candidate("Women's Masters", 12, true, 16),
      candidate("Women's Beginners", 4, false, 8),
    ]),
    [
      { label: "Men's Beginners", playerCount: 6, drawSize: 8 },
      { label: "Women's Beginners", playerCount: 4, drawSize: 8 },
    ],
  );
});

test('sequential generation continues after a failure and failed draws are retryable', async () => {
  const calls = [];
  const results = await generateDrawsSequentially(
    ["Men's Beginners", "Men's Challengers", "Women's Beginners"],
    async (label) => {
      calls.push(label);
      if (label === "Men's Challengers") throw new Error('permission-denied');
    },
  );
  const summary = generationSummary(results);
  assert.deepEqual(calls, ["Men's Beginners", "Men's Challengers", "Women's Beginners"]);
  assert.deepEqual(summary.generated, ["Men's Beginners", "Women's Beginners"]);
  assert.deepEqual(summary.retryable, ["Men's Challengers"]);
  assert.equal(summary.failed[0].error, 'permission-denied');
  assert.deepEqual(generationMessage(summary), {
    type: 'error',
    text: "Generated 2. Failed: Men's Challengers. Retry from Manage Draw.",
  });

  const remaining = previewPopulatedDraws([
    candidate("Men's Beginners", 6, true, 8),
    candidate("Men's Challengers", 8, false, 8),
    candidate("Women's Beginners", 4, true, 8),
  ]);
  assert.deepEqual(remaining, [{ label: "Men's Challengers", playerCount: 8, drawSize: 8 }]);

  const retry = await generateDrawsSequentially(summary.retryable, async () => undefined);
  assert.deepEqual(generationMessage(generationSummary(retry)), { type: 'success', text: 'Generated 1 draw.' });
});

test('knockout plan places by seedAnchors so seed 1 and 2 meet only in the final', () => {
  const players = field(8);
  const plan = buildKnockoutDrawPlan({
    eventId: 'e',
    draw,
    players,
    drawsize: 8,
    started: false,
    freezeSeeds: true,
  });
  const pairs = firstRound(plan.documents).map((doc) => [doc.data.player_1_name, doc.data.player_2_name]);
  const anchored = [...placeByAnchors(players, 8).entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => p.name);
  assert.deepEqual(anchored, ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']);
  assert.deepEqual(pairs, [
    ['P1', 'P8'],
    ['P4', 'P5'],
    ['P2', 'P7'],
    ['P3', 'P6'],
  ]);
  assert.deepEqual(
    plan.seedUpdates.map((u) => [u.id, u.seed]),
    [
      ['p1', 1],
      ['p2', 2],
      ['p3', 3],
      ['p4', 4],
    ],
  );
});

test('Manage Draw offers generate-all when populated draws remain', async () => {
  const elements = await readFile(
    new URL('../../src/pages/tournament/TournamentElements.tsx', import.meta.url),
    'utf8',
  );
  const page = await readFile(new URL('../../src/pages/Tournament.tsx', import.meta.url), 'utf8');
  assert.match(elements, /label="Generate all populated draws"/);
  assert.match(elements, /eligiblePopulatedCount > 0/);
  assert.match(page, /onGenerateAllPopulated=\{handleGenerateEveryPopulatedDraw\}/);
});

test('organizer generate-all wires preview, sequential persist, and retry copy', async () => {
  const hook = await readFile(new URL('../../src/pages/tournament/useTournament.ts', import.meta.url), 'utf8');
  assert.match(hook, /previewPopulatedDraws/);
  assert.match(hook, /generateDrawsSequentially/);
  assert.match(hook, /buildKnockoutDrawPlan/);
  assert.match(hook, /handleGenerateEveryPopulatedDraw/);
  assert.equal(
    generationMessage({ generated: [], failed: [{ label: 'A', ok: false }], retryable: ['A'] }).text,
    'Could not generate: A. Retry from Manage Draw.',
  );
});
