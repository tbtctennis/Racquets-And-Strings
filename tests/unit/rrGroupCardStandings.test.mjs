import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PersonRow } from '../../src/components/PersonRow.tsx';

const source = await readFile(new URL('../../src/pages/tournament/RRGroupCard.tsx', import.meta.url), 'utf8');
const standingsBlock = source.slice(source.indexOf('{standings.length > 0'), source.indexOf('tap a player to contact'));

test('RR standings rows render through PersonRow and the editControls slot', () => {
  assert.match(source, /import \{ PersonRow, seedForUid \} from '\.\.\/\.\.\/components\/PersonRow'/);
  assert.match(standingsBlock, /<PersonRow[\s\S]*editControls=\{/);
  assert.match(standingsBlock, /seed=\{seed\}/);
  assert.match(standingsBlock, /flex min-w-0 items-center overflow-hidden/);
  assert.match(standingsBlock, /density="compact"/);
  assert.match(standingsBlock, /filter\(\(row\) => row\.userId && row\.name !== PLAYER_LOADING\)/);
  assert.match(standingsBlock, /<SelectSheet/);
  assert.match(standingsBlock, /label=\{`Move \$\{formatPersonName\(row\.name\)\} to another zone`\}/);
  assert.match(standingsBlock, /Withdraw this player\?/);
  assert.doesNotMatch(standingsBlock, /text-fg font-semibold text-sm truncate flex-1 min-w-0/);
});

test('RR standings PersonRow keeps the 78px action slot and truncates at 360px', () => {
  for (const density of ['compact', 'default', 'comfortable']) {
    const html = renderToStaticMarkup(
      React.createElement(PersonRow, {
        name: 'Alexandria-Montgomery Playername',
        density,
        className: 'min-w-0 flex-1 border-b-0 pr-2',
        onClick: () => undefined,
        'aria-expanded': false,
        zone: React.createElement('span', null, 'ADV'),
        editControls: React.createElement('select', { 'aria-label': 'Move player to another zone' }),
        action: React.createElement('span', null, '12 pts'),
      }),
    );

    assert.match(html, new RegExp(`data-density="${density}"`));
    assert.match(html, /data-slot="edit-controls"/);
    assert.match(html, /w-\[78px\] shrink-0/);
    assert.match(html, /min-w-\[40%\]/);
    assert.match(html, /min-w-0 flex-1/);
    assert.match(html, /truncate whitespace-nowrap text-sm/);
    assert.match(html, />Alexand</);
    assert.match(html, /title="Alexandria-montgomery Playername"/);
  }
});
