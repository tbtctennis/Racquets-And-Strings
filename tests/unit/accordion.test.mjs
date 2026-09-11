import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Accordion } from '../../src/components/Accordion.tsx';
import { ReviewPanel } from '../../src/components/ReviewPanel.tsx';

test('Accordion hides the body until open and announces expanded state', () => {
  const closed = renderToStaticMarkup(
    React.createElement(Accordion, { id: 'progress', title: 'Progress', open: false, onToggle() {} }, 'body'),
  );
  assert.match(closed, /Progress/);
  assert.match(closed, /aria-expanded="false"/);
  assert.doesNotMatch(closed, />body</);

  const opened = renderToStaticMarkup(
    React.createElement(Accordion, { id: 'progress', title: 'Progress', open: true, onToggle() {} }, 'body'),
  );
  assert.match(opened, /aria-expanded="true"/);
  assert.match(opened, />body</);
});

test('amber tone keeps ReviewPanel queue chrome', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      ReviewPanel,
      { title: 'Pending', count: 2, defaultOpen: true },
      React.createElement('p', null, 'item'),
    ),
  );
  assert.match(html, /Pending \(2\)/);
  assert.match(html, /border-amber-500\/20/);
  assert.match(html, /bg-amber-500\/5/);
  assert.match(html, /item/);
});

test('the four hand-rolled disclosures consume Accordion', async () => {
  const sites = [
    ['../../src/pages/Leagues.tsx', /<Accordion[\s\S]*title="Progress"/],
    ['../../src/components/ReviewPanel.tsx', /from '\.\/Accordion'/],
    ['../../src/pages/tournament/OpponentPanels.tsx', /title="Your Match"/],
    ['../../src/pages/tournament/OpponentPanels.tsx', /title="Your Group"/],
  ];

  const opponent = await readFile(new URL('../../src/pages/tournament/OpponentPanels.tsx', import.meta.url), 'utf8');
  const leagues = await readFile(new URL('../../src/pages/Leagues.tsx', import.meta.url), 'utf8');
  const review = await readFile(new URL('../../src/components/ReviewPanel.tsx', import.meta.url), 'utf8');

  for (const [file, pattern] of sites) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /from ['"][^'"]*Accordion['"]/, `${file} does not import Accordion`);
    assert.match(source, pattern, `${file} is missing ${pattern}`);
  }

  assert.match(opponent, /<Accordion/);
  assert.doesNotMatch(opponent, /ChevronDown|ChevronUp/);
  assert.doesNotMatch(leagues, /hide ▴|show ▾/);
  assert.doesNotMatch(review, /ChevronDown|ChevronUp/);
  assert.match(review, /tone="amber"/);
});
