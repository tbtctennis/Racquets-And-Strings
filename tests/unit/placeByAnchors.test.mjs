import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { assignByes, placeByAnchors, seedAnchors } from '../../src/features/tournament/domain/seeding.ts';
import { buildRRKnockoutDocs, buildZoneTierGroups } from '../../src/pages/tournament/rrGeneration.ts';
import { fallbackTemplate } from '../../src/pages/tournament/utils.ts';

const player = (uid, name = uid) => ({ uid, name, participantId: uid });
const field = (n) => Array.from({ length: n }, (_, i) => player(`p${i + 1}`, `P${i + 1}`));
const draw = { tournamentChoice: 'Singles', division: "Men's", skillGroup: 'Challengers' };

const firstRound = (docs) =>
  docs.filter((doc) => typeof doc.fields.player_1_slot === 'number' && typeof doc.fields.player_2_slot === 'number');

const names = (docs) => firstRound(docs).map((doc) => [doc.fields.player_1_name, doc.fields.player_2_name]);

const halves = (docs) => {
  const round = firstRound(docs);
  const mid = round.length / 2;
  const uids = (slice) => slice.flatMap((doc) => [doc.fields.player_1_uid, doc.fields.player_2_uid]);
  return [uids(round.slice(0, mid)), uids(round.slice(mid))];
};

const quarters = (docs) => {
  const round = firstRound(docs);
  const q = round.length / 4;
  return [0, 1, 2, 3].map((i) =>
    round.slice(i * q, (i + 1) * q).flatMap((doc) => [doc.fields.player_1_uid, doc.fields.player_2_uid]),
  );
};

const byeRecipients = (docs) =>
  firstRound(docs).flatMap((doc) => {
    const aBye = !doc.fields.player_1_uid && doc.fields.player_1_name === 'BYE';
    const bBye = !doc.fields.player_2_uid && doc.fields.player_2_name === 'BYE';
    if (aBye && doc.fields.player_2_uid) return [doc.fields.player_2_uid];
    if (bBye && doc.fields.player_1_uid) return [doc.fields.player_1_uid];
    return [];
  });

const stripTimes = (docs) =>
  docs.map(({ docId, fields }) => {
    const { created_at: _created, ...rest } = fields;
    return { docId, fields: rest };
  });

const knockout = (players, drawsize) =>
  buildRRKnockoutDocs({
    eventId: 'e',
    drawKey: 'k',
    draw,
    advancingPlayers: players,
    started: false,
    drawsize,
  });

test('placeByAnchors puts seed 1 in slot 1 and omits bye seeds', () => {
  assert.deepEqual(Object.fromEntries(placeByAnchors(['a', 'b', 'c', 'd', 'e', 'f'], 8)), {
    1: 'a',
    2: 'b',
    3: 'c',
    4: 'd',
    5: 'e',
    6: 'f',
  });
  assert.equal(placeByAnchors(['a', 'b', 'c', 'd', 'e', 'f'], 8).has(7), false);
  assert.equal(placeByAnchors(['a', 'b', 'c', 'd', 'e', 'f'], 8).has(8), false);
  assert.deepEqual(
    assignByes(8, 6).filter((seed) => seed == null),
    [null, null],
  );
});

test('8-draw knockout places seed 1 top, seed 2 opposite, 3 and 4 in the other quarters', () => {
  const docs = knockout(field(8), 8);
  assert.deepEqual(
    firstRound(docs).map((doc) => [doc.fields.player_1_slot, doc.fields.player_2_slot]),
    [
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ],
  );
  assert.deepEqual(names(docs), [
    ['P1', 'P8'],
    ['P4', 'P5'],
    ['P2', 'P7'],
    ['P3', 'P6'],
  ]);
  const [top, bottom] = halves(docs);
  assert.ok(top.includes('p1'));
  assert.ok(bottom.includes('p2'));
  const [q1, q2, q3, q4] = quarters(docs);
  assert.ok(q1.includes('p1'));
  assert.ok(q2.includes('p4'));
  assert.ok(q3.includes('p2'));
  assert.ok(q4.includes('p3'));
});

test('byes land on the top seeds', () => {
  assert.deepEqual(byeRecipients(knockout(field(6), 8)).sort(), ['p1', 'p2']);
  assert.deepEqual(byeRecipients(knockout(field(12), 16)).sort(), ['p1', 'p2', 'p3', 'p4']);
});

test('regenerating the same field produces the same bracket', () => {
  const players = field(8);
  assert.deepEqual(stripTimes(knockout(players, 8)), stripTimes(knockout(players, 8)));
});

test('16 and 32 draws keep seed 1 opposite seed 2', () => {
  const d16 = knockout(field(16), 16);
  const [top16, bottom16] = halves(d16);
  assert.ok(top16.includes('p1'));
  assert.ok(bottom16.includes('p2'));
  const d32 = knockout(field(32), 32);
  const [top32, bottom32] = halves(d32);
  assert.ok(top32.includes('p1'));
  assert.ok(bottom32.includes('p2'));
  assert.deepEqual(
    fallbackTemplate(32)
      .filter((m) => typeof m.player_1 === 'number')
      .map((m) => [m.player_1, m.player_2]),
    (() => {
      const order = seedAnchors(32);
      const pairs = [];
      for (let i = 0; i < order.length; i += 2) pairs.push([order[i], order[i + 1]]);
      return pairs;
    })(),
  );
});

test('RR group formation stays unseeded and identical with or without seeds', () => {
  const seeded = [
    { uid: 'z', name: 'Zoe', participantId: '1', skillLevel: 3, seed: 1 },
    { uid: 'a', name: 'Amy', participantId: '2', skillLevel: 3, seed: 2 },
  ];
  const plain = seeded.map(({ seed: _seed, ...player }) => player);
  assert.deepEqual(
    buildZoneTierGroups(seeded, {}, {}).map((g) => g.players.map((p) => p.uid)),
    buildZoneTierGroups(plain, {}, {}).map((g) => g.players.map((p) => p.uid)),
  );
});

test('knockout generation wires placeByAnchors and does not start blank', async () => {
  const source = await readFile(new URL('../../src/pages/tournament/useTournament.ts', import.meta.url), 'utf8');
  assert.match(source, /placeByAnchors/);
  assert.match(source, /orderRRGroupWinners/);
  assert.doesNotMatch(source, /Knockout generation starts blank/);
});
