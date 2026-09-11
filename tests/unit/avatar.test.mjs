import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Avatar } from '../../src/components/Avatar.tsx';
import { initialOf } from '../../src/utils/nameFormatting.ts';

test('initialOf is the canonical formatted-name initial', () => {
  assert.equal(initialOf('  bLAKE bell  '), 'B');
  assert.equal(initialOf('BYE'), 'B');
  assert.equal(initialOf(''), 'P');
});

test('Avatar exposes exactly the row and profile sizes', () => {
  const row = renderToStaticMarkup(React.createElement(Avatar, { name: 'Blake Bell' }));
  const profile = renderToStaticMarkup(React.createElement(Avatar, { name: 'Blake Bell', size: 'profile' }));
  const photo = renderToStaticMarkup(React.createElement(Avatar, { name: 'Blake Bell', src: '/avatar.jpg' }));

  assert.match(row, /h-6 w-6/);
  assert.match(row, />B<\/span>/);
  assert.match(profile, /h-24 w-24/);
  assert.match(profile, />B<\/span>/);
  assert.match(photo, /h-6 w-6/);
  assert.doesNotMatch(photo, /h-5|h-20|h-16/);
});
