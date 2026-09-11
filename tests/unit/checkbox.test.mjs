import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Checkbox } from '../../src/components/Checkbox.tsx';

const srcRoot = fileURLToPath(new URL('../../src', import.meta.url));

const renderCheckbox = (props) =>
  renderToStaticMarkup(React.createElement(Checkbox, { checked: false, label: 'Record walkover', ...props }));

async function walkSourceFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkSourceFiles(path)));
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(path);
  }
  return out;
}

test('Checkbox is a labelled native checkbox with clay accent', () => {
  const on = renderCheckbox({ checked: true, label: 'Record walkover' });
  const off = renderCheckbox({ checked: false, disabled: true, label: 'Same as phone number' });

  assert.match(on, /type="checkbox"/);
  assert.match(on, /checked=""/);
  assert.match(on, /aria-label="Record walkover"/);
  assert.match(on, /Record walkover/);
  assert.match(on, /accent-clay/);
  assert.match(on, /min-h-11/);

  assert.match(off, /disabled=""/);
  assert.match(off, /aria-label="Same as phone number"/);
  assert.doesNotMatch(off, /checked=""/);
});

test('remaining checkbox call sites consume Checkbox', async () => {
  const sites = {
    'pages/Tasks.tsx': /import \{ Checkbox \} from '\.\.\/components\/Checkbox'/,
    'pages/tournament/ScoreModal.tsx': /import \{ Checkbox \} from '\.\.\/\.\.\/components\/Checkbox'/,
    'pages/tournament/TournamentElements.tsx': /import \{ Checkbox \} from '\.\.\/\.\.\/components\/Checkbox'/,
    'features/profile/components/ProfileInfo.tsx':
      /import \{ Checkbox \} from '\.\.\/\.\.\/\.\.\/components\/Checkbox'/,
    'pages/services/ServicesElements.tsx': /import \{ Checkbox \} from '\.\.\/\.\.\/components\/Checkbox'/,
  };

  for (const [rel, importRe] of Object.entries(sites)) {
    const source = await readFile(join(srcRoot, rel), 'utf8');
    assert.match(source, importRe, `${rel} must import Checkbox`);
    assert.match(source, /<Checkbox[\s\S]*label=/, `${rel} must render Checkbox`);
    assert.doesNotMatch(source, /type="checkbox"/, `${rel} must not keep a raw checkbox`);
  }

  const tasks = await readFile(join(srcRoot, 'pages/Tasks.tsx'), 'utf8');
  assert.equal([...tasks.matchAll(/<Checkbox/g)].length, 2);

  const score = await readFile(join(srcRoot, 'pages/tournament/ScoreModal.tsx'), 'utf8');
  assert.match(
    score,
    /<Checkbox checked=\{walkover\.checked\} onChange=\{walkover\.onChange\} label="Record walkover"/,
  );

  const profile = await readFile(join(srcRoot, 'features/profile/components/ProfileInfo.tsx'), 'utf8');
  assert.match(profile, /label="Same as phone number"/);
  assert.match(profile, /<Switch /);
});

test('no raw checkbox remains in src except Checkbox.tsx', async () => {
  const leftovers = [];
  for (const path of await walkSourceFiles(srcRoot)) {
    const source = await readFile(path, 'utf8');
    if (!source.includes('type="checkbox"')) continue;
    const rel = relative(srcRoot, path);
    if (rel === 'components/Checkbox.tsx') continue;
    leftovers.push(rel);
  }

  assert.deepEqual(leftovers, []);
});
