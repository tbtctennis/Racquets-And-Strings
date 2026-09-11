import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SegmentedControl } from '../../src/components/SegmentedControl.tsx';
import { CONTROL_SELECTED, CONTROL_UNSELECTED, controlChrome } from '../../src/lib/controlChrome.ts';

const srcRoot = new URL('../../src/', import.meta.url);

const CONTROL_FILES = [
  'components/SegmentedControl.tsx',
  'features/events/EventsElements.tsx',
  'features/profile/components/AvailabilityModal.tsx',
  'features/profile/components/ProfileInfo.tsx',
  'features/tasks/CheckInModal.tsx',
  'features/tasks/PhotoSubmitModal.tsx',
  'pages/CourtMap.tsx',
  'pages/Signup.tsx',
  'pages/StaticPages.tsx',
  'pages/Tournament.tsx',
  'pages/courtmap/CourtMapElements.tsx',
  'pages/services/ServicesElements.tsx',
  'pages/tournament/BracketAccordion.tsx',
  'pages/tournament/RoundRobinView.tsx',
  'pages/tournament/TournamentElements.tsx',
];

const RETIRED_CONTROL_CHROME = [
  'bg-white text-ink',
  'hover:bg-white/90',
  'bg-fg/5 text-fg hover:bg-fg/10',
  'bg-fg/10 text-fg hover:bg-fg/20',
  'bg-tennis-surface/60 text-fg',
  'bg-clay/25 text-fg',
  'bg-clay/15 border-clay/40 text-clay-fg',
];

async function walkSource(dirUrl, prefix = '') {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dirUrl);
    if (entry.isDirectory()) files.push(...(await walkSource(url, rel)));
    else if (/\.(tsx?|css)$/.test(entry.name)) files.push({ rel, url });
  }
  return files;
}

test('one selected treatment: clay fill, white text; unselected is recessed tennis-deep', () => {
  assert.equal(CONTROL_SELECTED, 'bg-clay text-white');
  assert.equal(CONTROL_UNSELECTED, 'bg-tennis-deep text-fg hover:bg-tennis-deep/80');
  assert.equal(controlChrome(true), CONTROL_SELECTED);
  assert.equal(controlChrome(false), CONTROL_UNSELECTED);
  assert.match(CONTROL_UNSELECTED, /bg-tennis-deep/);
  assert.doesNotMatch(CONTROL_UNSELECTED, /bg-white|bg-fg\/5/);
  assert.notEqual(CONTROL_SELECTED, CONTROL_UNSELECTED);
});

test('unselected-as-selected is 0: no control uses theme-blind bg-white text-ink', async () => {
  const files = await walkSource(srcRoot);
  const hits = [];
  for (const file of files) {
    if (file.rel === 'components/ContactOpponentButton.tsx') continue;
    const source = await readFile(file.url, 'utf8');
    const count = source.split('bg-white text-ink').length - 1;
    if (count) hits.push(`${file.rel}:${count}`);
  }
  assert.deepEqual(hits, [], `unselected-as-selected remains: ${hits.join('; ')}`);
});

test('SegmentedControl, tabs, pills and filters share the one treatment', async () => {
  const treatments = new Set();
  for (const rel of CONTROL_FILES) {
    const source = await readFile(new URL(rel, srcRoot), 'utf8');
    assert.match(source, /from ['"].*lib\/controlChrome['"]/, `${rel} does not use controlChrome`);
    for (const retired of RETIRED_CONTROL_CHROME) {
      assert.equal(source.includes(retired), false, `${rel} still has ${retired}`);
    }
    if (
      source.includes('controlChrome(') ||
      source.includes('CONTROL_SELECTED') ||
      source.includes('CONTROL_UNSELECTED')
    ) {
      treatments.add('controlChrome');
    }
  }
  assert.deepEqual([...treatments], ['controlChrome']);
});

test('selected and unselected segments are distinct in markup', () => {
  const html = renderToStaticMarkup(
    React.createElement(SegmentedControl, {
      options: [
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'done', label: 'Done' },
      ],
      value: 'upcoming',
      onChange: () => {},
    }),
  );
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /aria-selected="false"/);
  assert.match(html, /text-white/);
  assert.match(html, /bg-tennis-deep/);
  assert.match(html, /bg-clay/);
  assert.doesNotMatch(html, /bg-white text-ink/);
});
