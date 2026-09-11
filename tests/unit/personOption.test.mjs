import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PersonOption } from '../../src/components/PersonOption.tsx';

const render = (props = {}) =>
  renderToStaticMarkup(
    React.createElement(PersonOption, {
      name: '  bLAKE bell  ',
      onSelect: () => {},
      ...props,
    }),
  );

test('renders a compact, formatted option with native keyboard activation', () => {
  const html = render({ meta: 'Member' });

  assert.match(html, /^<button type="button" role="option"/);
  assert.match(html, /aria-label="Blake Bell"/);
  assert.match(html, /aria-selected="false"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /min-h-9/);
  assert.match(html, />Blake B</);
  assert.match(html, /title="Blake Bell"/);
  assert.match(html, />Member</);
});

test('marks the selected option and keeps its name readable on one line', () => {
  const html = render({ name: 'Annas Tariq', selected: true, className: 'custom-option' });

  assert.match(html, /aria-selected="true"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-label="Annas Tariq"/);
  assert.match(html, />Annas T</);
  assert.match(html, /bg-clay\/15/);
  assert.match(html, /min-w-\[40%\]/);
  assert.match(html, /truncate/);
  assert.match(html, /custom-option/);
  assert.match(html, />✓</);
  assert.doesNotMatch(html, />Ann\.\.\.</);
});

test('renders the 90px card as a keyboard-operable radio choice', () => {
  const html = render({ variant: 'card', selectionRole: 'radio', selected: true, meta: 'Women’s' });

  assert.match(html, /role="radio"/);
  assert.match(html, /aria-checked="true"/);
  assert.match(html, /min-h-\[90px\]/);
  assert.match(html, /rounded-2xl/);
  assert.doesNotMatch(html, /aria-selected=/);
});

test('uses the shared fallback and does not introduce raw palette colors', () => {
  const html = render({ name: '' });

  assert.match(html, />Player</);
  assert.doesNotMatch(html, /#[0-9a-f]{3,8}/i);
});

test('the nine picker surfaces route person choices through PersonOption', () => {
  const memberSearch = fs.readFileSync(
    new URL('../../src/features/members/MemberSearchInput.tsx', import.meta.url),
    'utf8',
  );
  assert.match(memberSearch, /<PersonOption/);
  assert.match(
    fs.readFileSync(new URL('../../src/pages/tournament/AddPlayerPanel.tsx', import.meta.url), 'utf8'),
    /<PersonOption/,
  );
  assert.match(
    fs.readFileSync(new URL('../../src/pages/tournament/MatchCard.tsx', import.meta.url), 'utf8'),
    /<PersonOption/,
  );
  assert.match(
    fs.readFileSync(new URL('../../src/pages/tournament/RRGroupCard.tsx', import.meta.url), 'utf8'),
    /<PersonOption/,
  );
  assert.match(
    fs.readFileSync(new URL('../../src/pages/tournament/RoundRobinView.tsx', import.meta.url), 'utf8'),
    /<PersonOption/,
  );
  assert.match(
    fs.readFileSync(new URL('../../src/features/events/EventsElements.tsx', import.meta.url), 'utf8'),
    /MemberSearchInput/,
  );
  assert.match(
    fs.readFileSync(new URL('../../src/features/tasks/ClaimModal.tsx', import.meta.url), 'utf8'),
    /MemberSearchInput/,
  );
  assert.match(
    fs.readFileSync(new URL('../../src/pages/tournament/AddTeammatePanel.tsx', import.meta.url), 'utf8'),
    /MemberSearchInput/,
  );
});
