import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { formatPersonName } from '../../src/utils/nameFormatting.ts';
import { initialOf, PersonRow } from '../../src/components/PersonRow.tsx';

const renderRow = (props = {}) => renderToStaticMarkup(React.createElement(PersonRow, { name: 'Member A', ...props }));

test('PersonRow renders a positive seed before the name', () => {
  const markup = renderRow({ seed: 1 });

  assert.match(markup, /\(1\).*Member A/);
  assert.match(markup, /aria-label="Seed 1"/);
});

test('PersonRow omits missing and zero seeds', () => {
  assert.doesNotMatch(renderRow(), /Seed|\(0\)/);
  assert.doesNotMatch(renderRow({ seed: 0 }), /Seed|\(0\)/);
});

test('initialOf returns the first initial of a trimmed name', () => {
  assert.equal(initialOf(' blake bell '), 'B');
});

test('initialOf uses the supplied fallback for an empty name', () => {
  assert.equal(initialOf('', 'U'), 'U');
  assert.equal(initialOf('   '), 'P');
});

test('initialOf preserves bracket placeholders through the canonical formatter', () => {
  assert.equal(initialOf('BYE'), 'B');
  assert.equal(initialOf('Winner of QF1'), 'W');
});

test('formatPersonName trims and title-cases ordinary names', () => {
  assert.equal(formatPersonName('  bLAKE bell  '), 'Blake Bell');
  assert.equal(formatPersonName(''), 'Player');
});

test('PersonRow renders an avatar at the shared 24px size', () => {
  const withPhoto = renderRow({ avatar: 'https://example.test/avatar.jpg' });
  const withInitial = renderRow();

  assert.match(withPhoto, /h-6 w-6/);
  assert.match(withInitial, /h-6 w-6/);
  assert.match(withInitial, />M<\/span>/);
});

test('PersonRow renders every density without changing the row contract', () => {
  const expectedHeights = {
    compact: 'h-10',
    default: 'h-[57px]',
    comfortable: 'h-[84px]',
  };

  for (const [density, height] of Object.entries(expectedHeights)) {
    const markup = renderRow({ density });

    assert.match(markup, new RegExp(`data-density="${density}"`));
    assert.match(markup, new RegExp(height.replaceAll('[', '\\[').replaceAll(']', '\\]')));
    assert.match(markup, /min-w-0/);
  }
});

test('PersonRow renders edit controls in their dedicated slot beside a fixed action slot', () => {
  const markup = renderRow({
    editControls: React.createElement('button', { type: 'button' }, 'Edit'),
    action: React.createElement('button', { type: 'button' }, 'Open'),
  });

  assert.match(markup, /data-slot="edit-controls"/);
  assert.match(markup, /Edit/);
  assert.match(markup, /w-\[78px\]/);
  assert.match(markup, /Open/);
});

test('PersonRow keeps edit controls outside the expand button', () => {
  const markup = renderRow({
    onClick: () => undefined,
    'aria-expanded': true,
    editControls: React.createElement('button', { type: 'button' }, 'Withdraw'),
    action: React.createElement('span', null, '12 pts'),
  });
  const expandAt = markup.indexOf('aria-expanded="true"');
  const expandClose = markup.indexOf('</button>', expandAt);
  const editAt = markup.indexOf('data-slot="edit-controls"');
  const withdrawAt = markup.indexOf('Withdraw');
  const actionAt = markup.indexOf('w-[78px]');

  assert.match(markup, /aria-expanded="true"/);
  assert.match(markup, /Member A/);
  assert.ok(expandAt >= 0 && expandClose > expandAt);
  assert.ok(editAt > expandClose);
  assert.ok(withdrawAt > editAt);
  assert.ok(actionAt > editAt);
  assert.match(markup, /12 pts/);
});

test('PersonRow profile link and expand control stay siblings of edit controls', () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(PersonRow, {
        name: 'Member A',
        nameHref: '/players/u1',
        onClick: () => undefined,
        'aria-expanded': true,
        editControls: React.createElement('button', { type: 'button' }, 'Withdraw'),
        action: React.createElement('span', null, '12 pts'),
      }),
    ),
  );
  const expandAt = markup.indexOf('aria-expanded="true"');
  const expandClose = markup.indexOf('</button>', expandAt);
  const editAt = markup.indexOf('data-slot="edit-controls"');

  assert.match(markup, /href="\/players\/u1"/);
  assert.match(markup, /aria-label="Details for Member A"/);
  assert.match(markup, /aria-expanded="true"[^>]*><\/button>/);
  assert.ok(expandAt >= 0 && expandClose > expandAt);
  assert.ok(editAt > expandClose);
  assert.ok(markup.indexOf('href="/players/u1"') > expandClose);
});

test('PersonRow keeps long names in a single truncating line at mobile width', () => {
  const markup = renderRow({
    name: 'Alexandria-Montgomery Playername',
    subtitle: 'Long secondary detail',
    editControls: React.createElement('button', { type: 'button' }, 'Edit'),
    action: React.createElement('button', { type: 'button' }, 'Open'),
  });

  assert.match(markup, /min-w-\[40%\]/);
  assert.match(markup, /min-w-0 flex-1/);
  assert.match(markup, /truncate whitespace-nowrap text-sm/);
  assert.match(markup, /truncate whitespace-nowrap text-xs/);
  assert.match(markup, /shrink-0/);
  assert.match(markup, /w-\[78px\] shrink-0/);
  assert.match(markup, />Alexand</);
  assert.doesNotMatch(markup, /Ann\.\.\./);
});

test('PersonRow seed plus one action number stays within the two-stat budget', () => {
  const markup = renderRow({
    seed: 1,
    action: React.createElement('span', null, '12 Group Pts'),
  });

  assert.match(markup, /aria-label="Seed 1"/);
  assert.match(markup, /12 Group Pts/);
  assert.match(markup, /w-\[78px\] shrink-0/);
  assert.match(markup, /min-w-\[40%\]/);
  assert.equal((markup.match(/\(\d+\)/g) ?? []).length, 1);
});

test('PersonRow shows Annas T rather than CSS-ellipsing the first name', () => {
  const markup = renderRow({
    name: 'Annas Tariq',
    action: React.createElement('button', { type: 'button' }, 'Open'),
  });

  assert.match(markup, />Annas T</);
  assert.match(markup, /title="Annas Tariq"/);
  assert.match(markup, /min-w-\[40%\]/);
  assert.match(markup, /w-\[78px\] shrink-0/);
  assert.doesNotMatch(markup, />Ann\.\.\.</);
});
