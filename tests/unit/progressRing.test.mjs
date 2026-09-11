import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProgressRing } from '../../src/components/ProgressRing.tsx';

const renderRing = (props = {}) =>
  renderToStaticMarkup(React.createElement(ProgressRing, { value: 50, label: 'Initiation progress', ...props }));

test('ProgressRing draws a labelled clay ring and clamps the percent', () => {
  const html = renderRing({ value: 40, label: 'Initiation progress' });
  const over = renderRing({ value: 140 });
  const under = renderRing({ value: -20, label: 'Group match progress' });

  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="Initiation progress"/);
  assert.match(html, />40%</);
  assert.match(html, /stroke-dasharray/);
  assert.match(html, /text-clay/);
  assert.match(html, /text-fg\/10/);

  assert.match(over, />100%</);
  assert.match(under, />0%</);
  assert.match(under, /aria-label="Group match progress"/);
});

test('Tasks header and Initiation accordion both consume ProgressRing', async () => {
  const tasks = await readFile(new URL('../../src/pages/Tasks.tsx', import.meta.url), 'utf8');
  const initiation = tasks.slice(tasks.indexOf('id="initiation"'), tasks.indexOf('{TASKS.map'));

  assert.match(tasks, /import \{ ProgressRing \} from '\.\.\/components\/ProgressRing'/);
  assert.equal([...tasks.matchAll(/<ProgressRing/g)].length, 2);

  assert.match(tasks, /Member progress[\s\S]*<ProgressRing value=\{initiationPct\} label="Initiation progress"/);
  assert.match(initiation, /<ProgressRing value=\{initiationPct\} label="Initiation checklist progress" size=\{32\}/);
  assert.match(initiation, /\+\{SETUP_POINTS\} pts/);
  assert.match(initiation, /\{doneUnlocked\}\/\{UNLOCKED_TASK_IDS\.length\}/);
});

test('RR group card uses ProgressRing for real matches and keeps the bonus Switch', async () => {
  const rr = await readFile(new URL('../../src/pages/tournament/RRGroupCard.tsx', import.meta.url), 'utf8');
  const header = rr.slice(rr.indexOf('{/* Group header.'), rr.indexOf('{/* Standings'));

  assert.match(rr, /import \{ ProgressRing \} from '\.\.\/\.\.\/components\/ProgressRing'/);
  assert.match(rr, /import \{ realRoundRobinMatches \} from '\.\.\/\.\.\/features\/tournament\/domain\/roundRobin'/);
  assert.match(rr, /const realMatches = realRoundRobinMatches\(matches\)/);
  assert.match(
    header,
    /realMatches\.length > 0 && <ProgressRing value=\{groupProgress\} label="Group match progress" size=\{32\} \/>/,
  );
  assert.match(header, /<Switch[\s\S]*label=\{bonusAwarded \? 'Bonus Awarded' : 'Group Bonus'\}/);
  assert.doesNotMatch(header, /<circle/);
  assert.doesNotMatch(header, /peer-checked/);
});
