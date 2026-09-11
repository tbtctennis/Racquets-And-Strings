import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../../src/components/Button.tsx';
import { ContactOpponentButton } from '../../src/components/ContactOpponentButton.tsx';
import { Switch } from '../../src/components/Switch.tsx';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('BT-17: tappable neighbours keep gap-2 so grown targets cannot steal taps', async () => {
  const contact = await load('../../src/components/ContactOpponentButton.tsx');
  const approve = await load('../../src/components/ApprovePair.tsx');
  const entity = await load('../../src/components/EntityCard.tsx');
  const place = await load('../../src/components/PlaceCard.tsx');
  const player = await load('../../src/components/PlayerCard.tsx');
  const matches = await load('../../src/pages/Matches.tsx');
  const review = await load('../../src/features/tasks/ReviewQueue.tsx');

  assert.match(contact, /justify-center gap-2 min-w-0/);
  assert.doesNotMatch(contact, /justify-center gap-1\.5 min-w-0/);

  assert.match(approve, /flex shrink-0 gap-2/);
  assert.match(entity, /flex shrink-0 items-center gap-2/);
  assert.match(place, /flex flex-wrap justify-center gap-2/);

  assert.doesNotMatch(player, /p-1 -m-1/);
  assert.match(player, /flex items-center gap-3/);

  assert.match(matches, /flex flex-col items-end gap-2 shrink-0/);
  assert.match(matches, /flex items-center gap-2 flex-wrap justify-end/);
  assert.match(review, /<ApprovePair/);
});

test('BT-9/BT-10: Button, pills, toggles and icon buttons expose a 44px hit area', async () => {
  const buttonHtml = renderToStaticMarkup(React.createElement(Button, null, 'Save'));
  assert.match(buttonHtml, /h-11/);
  assert.match(buttonHtml, /min-h-11/);

  const contactHtml = renderToStaticMarkup(
    React.createElement(ContactOpponentButton, { name: 'Blake Bell', email: 'blake@example.com', phone: '4165550123' }),
  );
  assert.match(contactHtml, /gap-2/);
  assert.equal((contactHtml.match(/h-11 w-11 min-h-11 min-w-11/g) || []).length, 3);

  const switchHtml = renderToStaticMarkup(
    React.createElement(Switch, { checked: false, onChange: () => undefined, label: 'Group Bonus' }),
  );
  assert.match(switchHtml, /min-h-11 min-w-11/);
  assert.match(switchHtml, /h-6 w-10/);

  const pill = await load('../../src/components/ContactOpponentButton.tsx');
  assert.match(pill, /h-11 min-h-11 px-6/);
  assert.match(pill, /h-11 w-11 min-h-11 min-w-11/);

  const header = await load('../../src/components/HeaderMenu.tsx');
  const navbar = await load('../../src/components/Navbar.tsx');
  const toast = await load('../../src/components/Toast.tsx');
  const error = await load('../../src/components/ErrorScreen.tsx');
  const profile = await load('../../src/components/ProfileCard.tsx');
  const segmented = await load('../../src/components/SegmentedControl.tsx');
  const matches = await load('../../src/pages/Matches.tsx');
  const player = await load('../../src/components/PlayerCard.tsx');

  assert.match(header, /inline-flex h-11 w-11 items-center justify-center/);
  assert.match(navbar, /inline-flex h-11 w-11 items-center justify-center/);
  assert.match(toast, /inline-flex h-11 w-11 shrink-0 items-center justify-center/);
  assert.match(error, /inline-flex min-h-11 items-center justify-center/);
  assert.match(profile, /inline-flex min-h-11 items-center rounded-full/);
  assert.match(segmented, /flex-1 min-h-11 text-center/);
  assert.match(player, /inline-flex h-11 w-11 shrink-0 items-center justify-center/);
  assert.match(matches, /inline-flex h-11 w-11 items-center justify-center rounded-xl bg-fg\/5/);
});
