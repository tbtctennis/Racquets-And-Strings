import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { listboxKeyAction } from '../../src/lib/listboxKeyboard.ts';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('listbox arrows, enter and escape cover open, move, select and close', () => {
  assert.deepEqual(listboxKeyAction('ArrowDown', 3, 0, false), { type: 'open', index: 0 });
  assert.deepEqual(listboxKeyAction('ArrowDown', 3, 0, true), { type: 'move', index: 1 });
  assert.deepEqual(listboxKeyAction('ArrowUp', 3, 0, true), { type: 'move', index: 0 });
  assert.deepEqual(listboxKeyAction('Enter', 3, 1, true), { type: 'select', index: 1 });
  assert.deepEqual(listboxKeyAction('Escape', 3, 1, true), { type: 'close' });
  assert.equal(listboxKeyAction('Enter', 3, 1, false), null);
  assert.equal(listboxKeyAction('Tab', 3, 1, true), null);
});

test('password toggles are focusable, named and pressed', async () => {
  const signup = await load('../../src/pages/Signup.tsx');
  const toggles = [...signup.matchAll(/aria-label="Show password"/g)];
  assert.equal(toggles.length, 3);
  assert.match(signup, /aria-pressed=\{showPassword\}/);
  assert.match(signup, /aria-pressed=\{showConfirmPassword\}/);
  assert.doesNotMatch(signup, /tabIndex=\{-1\}/);
});

test('member picker and court comboboxes are keyboard operable', async () => {
  const addPlayer = await load('../../src/pages/tournament/AddPlayerPanel.tsx');
  const memberSearch = await load('../../src/features/members/MemberSearchInput.tsx');
  const score = await load('../../src/pages/tournament/ScoreModal.tsx');
  const photo = await load('../../src/features/tasks/PhotoSubmitModal.tsx');
  const profile = await load('../../src/features/profile/components/ProfileInfo.tsx');
  const courtMap = await load('../../src/pages/CourtMap.tsx');

  assert.match(addPlayer, /registerOverlay\(\(\) => setOpen\(false\)\)/);
  assert.match(addPlayer, /listboxKeyAction/);
  assert.match(addPlayer, /<PersonOption/);
  assert.match(memberSearch, /role="combobox"/);
  assert.match(memberSearch, /No members found/);
  assert.match(memberSearch, /listboxKeyAction/);

  for (const source of [score, photo, profile, courtMap]) {
    assert.match(source, /role="combobox"/);
    assert.match(source, /listboxKeyAction/);
    assert.match(source, /onClick=/);
  }
  assert.doesNotMatch(score, /onMouseDown=\{\(\) => \{/);
  assert.doesNotMatch(photo, /onMouseDown=\{\(\) => \{/);
  assert.match(courtMap, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
});

test('every select and the three X buttons have an accessible name', async () => {
  const files = [
    '../../src/pages/tournament/AddPlayerPanel.tsx',
    '../../src/pages/tournament/TournamentElements.tsx',
    '../../src/pages/tournament/RRGroupCard.tsx',
    '../../src/pages/marketplace/MarketplaceElements.tsx',
    '../../src/pages/services/ServicesElements.tsx',
    '../../src/features/events/EventsElements.tsx',
    '../../src/pages/courtmap/CourtMapElements.tsx',
    '../../src/features/tasks/ClaimModal.tsx',
  ];
  for (const file of files) {
    const source = await load(file);
    for (const match of source.matchAll(/<select\b/g)) {
      const lineStart = source.lastIndexOf('\n', match.index) + 1;
      const line = source.slice(lineStart, source.indexOf('\n', match.index));
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      let i = match.index;
      while (i < source.length) {
        if (source.startsWith('=>', i)) {
          i += 2;
          continue;
        }
        if (source[i] === '>') break;
        i += 1;
      }
      const tag = source.slice(match.index, i + 1);
      const namedInTag = /aria-label=/.test(tag) || /\bid=/.test(tag);
      const wrappingLabel = /<label[\s\S]*$/.test(source.slice(Math.max(0, match.index - 250), match.index));
      assert.equal(namedInTag || wrappingLabel, true, `unlabelled select in ${file}: ${tag.slice(0, 160)}`);
    }
  }

  const profile = await load('../../src/features/profile/components/ProfileInfo.tsx');
  const services = await load('../../src/pages/services/ServicesElements.tsx');
  assert.match(profile, /aria-label=\{`Remove \$\{c\}`\}/);
  assert.match(services, /aria-label=\{`Remove \$\{linkName \|\| 'linked account'\}`\}/);
  assert.match(services, /aria-label=\{`Remove \$\{b\}`\}/);
});

test('map popups join the overlay stack so Escape closes them', async () => {
  const courtMap = await load('../../src/pages/CourtMap.tsx');
  const css = await load('../../src/index.css');
  assert.match(courtMap, /registerOverlay\(closePopups\)/);
  assert.match(courtMap, /focusAfterOpen/);
  assert.match(css, /:focus-visible \{/);
  assert.match(css, /outline: 2px solid var\(--color-clay\)/);
});
