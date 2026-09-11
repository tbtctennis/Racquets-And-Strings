import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PersonPairRow } from '../../src/components/PersonPairRow.tsx';

const render = (props = {}) =>
  renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(PersonPairRow, {
        player1: { uid: 'one', name: '  blake bell ' },
        player2: { uid: 'two', name: 'casey wong' },
        ...props,
      }),
    ),
  );

test('renders one formatted, single-line pairing with metadata and action slot', () => {
  const html = render({ meta: '6–3 · 6–4', action: React.createElement('button', null, 'Approve') });

  assert.match(html, />Blake B</);
  assert.match(html, />Casey W</);
  assert.match(html, /title="Blake Bell"/);
  assert.match(html, /title="Casey Wong"/);
  assert.match(html, />vs</);
  assert.match(html, /6–3 · 6–4/);
  assert.match(html, />Approve</);
  assert.match(html, /min-w-\[40%\]/);
  assert.match(html, /w-\[78px\][^"]*shrink-0/);
});

test('emphasizes only the member identified as the winner', () => {
  const html = render({ winnerId: 'two' });

  assert.match(html, /title="Blake Bell"/);
  assert.match(html, /title="Casey Wong"/);
  assert.match(html, /href="\/players\/one"/);
  assert.match(html, /href="\/players\/two"/);
  assert.match(html, /truncate[^"]*font-bold[^"]*" title="Casey Wong"/);
  assert.doesNotMatch(html, /truncate[^"]*font-bold[^"]*" title="Blake Bell"/);
});

test('keeps long names truncatable and supports all row densities', () => {
  for (const density of ['compact', 'default', 'comfortable']) {
    const html = render({
      density,
      player1: { name: 'A very long first player name' },
      player2: { name: 'Another very long second player name' },
    });

    assert.match(html, /min-w-\[40%\]/);
    assert.match(html, /min-w-0/);
    assert.match(html, /whitespace-nowrap/);
    assert.match(html, /truncate/);
    assert.match(html, new RegExp(`py-${density === 'compact' ? '2' : density === 'comfortable' ? '4' : '3'}`));
  }
});

test('does not render an empty metadata or action slot', () => {
  const html = render();

  assert.doesNotMatch(html, /w-\[78px\]/);
  assert.doesNotMatch(html, /text-fg\/70">undefined/);
});

test('renders a positive seed before each name and omits a zero seed', () => {
  const html = render({
    player1: { uid: 'one', name: 'blake bell', seed: 1 },
    player2: { uid: 'two', name: 'casey wong', seed: 0 },
  });

  assert.match(html, /aria-label="Seed 1"/);
  assert.match(html, />Blake B</);
  assert.match(html, />Casey W</);
  assert.doesNotMatch(html, /Seed 0|\(0\)/);
});
