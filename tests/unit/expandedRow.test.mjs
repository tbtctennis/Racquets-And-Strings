import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { nextExpandedId } from '../../src/lib/expandedRow.ts';
import { PlayerCard } from '../../src/components/PlayerCard.tsx';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('nextExpandedId keeps a single open row', () => {
  assert.equal(nextExpandedId(null, 'a'), 'a');
  assert.equal(nextExpandedId('a', 'a'), null);
  assert.equal(nextExpandedId('a', 'b'), 'b');
});

test('leaderboard and matches share the one-at-a-time expanded-row helper', async () => {
  const leagues = await load('../../src/pages/Leagues.tsx');
  const matches = await load('../../src/pages/Matches.tsx');

  assert.match(leagues, /import \{ useExpandedRow \} from '\.\.\/lib\/expandedRow'/);
  assert.match(matches, /import \{ useExpandedRow \} from '\.\.\/lib\/expandedRow'/);
  assert.match(leagues, /const \{ expandedId, toggle \} = useExpandedRow\(\)/);
  assert.match(matches, /const \{ expandedId, toggle: toggleExpanded \} = useExpandedRow\(\)/);
  assert.doesNotMatch(leagues, /useState<Set<string>>/);
  assert.doesNotMatch(matches, /useState<Set<string>>/);
});

test('both leaderboard boards use ListGroup and highlight the own row only on PlayerCard', async () => {
  const leagues = await load('../../src/pages/Leagues.tsx');
  const tournament = leagues.slice(
    leagues.indexOf("{board === 'tournament'"),
    leagues.indexOf('{/* ── Community board'),
  );
  const community = leagues.slice(leagues.indexOf("{board === 'community'"));

  assert.match(tournament, /<ListGroup title="Standings"/);
  assert.match(community, /<ListGroup title="Standings"/);
  assert.match(tournament, /isYou=\{isUser\}/);
  assert.match(community, /isYou=\{isUser\}/);
  assert.doesNotMatch(community, /className="rounded-2xl bg-tennis-surface\/30"/);
  assert.doesNotMatch(community, /isUser \? 'bg-clay/);
  assert.doesNotMatch(tournament, /isUser \? 'bg-clay/);
  assert.equal((community.match(/bg-clay\/10/g) || []).length, 0);
});

test('PlayerCard own-row highlight is a single clay tint', () => {
  const html = renderToStaticMarkup(
    React.createElement(PlayerCard, {
      id: 'self',
      name: 'Member A',
      isYou: true,
      open: false,
      onToggle: () => undefined,
      stats: [{ label: 'Wins', value: '1' }],
    }),
  );

  assert.equal((html.match(/bg-clay\/10/g) || []).length, 1);
  assert.match(html, /\(you\)/);
});
