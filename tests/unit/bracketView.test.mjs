import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BracketView } from '../../src/pages/tournament/BracketView.tsx';

const knockoutMatch = {
  id: 'm1',
  event_id: 'e1',
  tournament_choice: 'Singles',
  division: "Men's",
  skill_group: 'Challengers',
  drawsize: 8,
  match_id: 'F-1',
  round: 'F',
  position: 1,
  player_1_slot: 1,
  player_2_slot: 2,
  player_1_name: 'Ada Lovelace',
  player_1_uid: 'u1',
  player_2_name: 'Grace Hopper',
  player_2_uid: 'u2',
  status: 'pending',
  started: false,
};

test('slot variant breaks the desktop knockout grid out of max-w-xl at lg', () => {
  const html = renderToStaticMarkup(
    React.createElement(BracketView, {
      matches: [knockoutMatch],
      drawTitle: 'Draw',
      variant: 'slot',
    }),
  );

  assert.match(html, /data-variant="slot"/);
  assert.match(html, /lg:w-screen/);
  assert.match(html, /lg:-ml-\[50vw\]/);
  assert.match(html, /lg:max-w-7xl/);
  assert.match(html, /minmax\(11\.5rem, 1fr\)/);
  assert.match(html, /Ada Lovelace/);
  assert.match(html, /Grace Hopper/);
});

test('knockout page keeps the accordion below lg and the slot grid on desktop', () => {
  const src = readFileSync(new URL('../../src/pages/Tournament.tsx', import.meta.url), 'utf8');
  assert.match(src, /className="lg:hidden"[\s\S]*<BracketAccordion/);
  assert.match(src, /className="hidden lg:block"[\s\S]*<BracketView[\s\S]*variant="slot"/);
  assert.doesNotMatch(src, /className="sm:hidden"[\s\S]*<BracketAccordion/);
  assert.doesNotMatch(src, /className="hidden sm:block"[\s\S]*<BracketView/);
});
