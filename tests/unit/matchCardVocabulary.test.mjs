import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const CARD_FILES = ['MatchCard.tsx', 'OpponentPanels.tsx', 'TournamentElements.tsx', 'RRGroupCard.tsx'];

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const load = (file) => readFile(new URL(`../../src/pages/tournament/${file}`, import.meta.url), 'utf8');

test('the four match-card files render only Pending or Done', async () => {
  for (const file of CARD_FILES) {
    const source = stripComments(await load(file));
    assert.doesNotMatch(source, /Score recorded/, `${file} still says Score recorded`);
    assert.doesNotMatch(source, /Scheduled on/, `${file} still says Scheduled on`);
    assert.doesNotMatch(source, /No show/, `${file} still says No show`);
    assert.doesNotMatch(source, /Unscheduled/, `${file} still says Unscheduled`);
    assert.doesNotMatch(source, /['"`]Completed['"`]/, `${file} still labels a match Completed`);
    assert.doesNotMatch(source, /['"`]Scheduled['"`]/, `${file} still labels a match Scheduled`);
    assert.doesNotMatch(source, /['"`]Win['"`]/, `${file} still labels a match Win`);
    assert.doesNotMatch(source, /['"`]Loss['"`]/, `${file} still labels a match Loss`);
  }

  const matchCard = await load('MatchCard.tsx');
  assert.match(matchCard, /title=\{match\.status === 'complete' \? 'Done' : 'Pending'\}/);

  const opponents = stripComments(await load('OpponentPanels.tsx'));
  assert.match(opponents, /text: 'Done'/);
  assert.match(opponents, /text: 'Pending'/);

  const elements = stripComments(await load('TournamentElements.tsx'));
  assert.match(elements, /text: 'Done'/);
  assert.match(elements, /text: 'Pending'/);

  const rr = stripComments(await load('RRGroupCard.tsx'));
  assert.match(rr, />Done</);
});
