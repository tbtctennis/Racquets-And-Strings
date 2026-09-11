import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Switch } from '../../src/components/Switch.tsx';

const srcRoot = fileURLToPath(new URL('../../src', import.meta.url));

const renderSwitch = (props) =>
  renderToStaticMarkup(
    React.createElement(Switch, { checked: false, onChange: () => undefined, label: 'Group Bonus', ...props }),
  );

async function walkSourceFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkSourceFiles(path)));
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(path);
  }
  return out;
}

test('Switch is a labelled role=switch with on and off chrome', () => {
  const on = renderSwitch({ checked: true, label: 'Email Notifications' });
  const off = renderSwitch({ checked: false, disabled: true });

  assert.match(on, /role="switch"/);
  assert.match(on, /aria-checked="true"/);
  assert.match(on, /aria-label="Email Notifications"/);
  assert.match(on, /bg-clay/);
  assert.match(on, /left-5/);
  assert.doesNotMatch(on, /peer-checked/);

  assert.match(off, /aria-checked="false"/);
  assert.match(off, /bg-fg\/20/);
  assert.match(off, /left-1/);
  assert.match(off, /disabled=""/);
  assert.match(off, /disabled:opacity-50/);
});

test('RR group bonus and profile toggles consume Switch', async () => {
  const rr = await readFile(new URL('../../src/pages/tournament/RRGroupCard.tsx', import.meta.url), 'utf8');
  const profile = await readFile(
    new URL('../../src/features/profile/components/ProfileInfo.tsx', import.meta.url),
    'utf8',
  );

  assert.match(rr, /import \{ Switch \} from '\.\.\/\.\.\/components\/Switch'/);
  assert.match(rr, /<Switch[\s\S]*label=\{bonusAwarded \? 'Bonus Awarded' : 'Group Bonus'\}/);
  assert.doesNotMatch(rr, /peer-checked/);
  assert.doesNotMatch(rr, /sr-only peer/);

  assert.match(profile, /import \{ Switch \} from '\.\.\/\.\.\/\.\.\/components\/Switch'/);
  assert.match(profile, /label=\{`Contact Method: \$\{label\}`\}/);
  assert.match(profile, /label="Email Notifications"/);
  assert.doesNotMatch(profile, /peer-checked/);
  assert.doesNotMatch(profile, /sr-only peer/);
});

test('no duplicated peer-checked clay toggle remains in src', async () => {
  const leftovers = [];
  for (const path of await walkSourceFiles(srcRoot)) {
    const source = await readFile(path, 'utf8');
    if (source.includes('peer-checked') || source.includes('sr-only peer')) {
      leftovers.push(relative(srcRoot, path));
    }
  }

  assert.deepEqual(leftovers, []);
});
