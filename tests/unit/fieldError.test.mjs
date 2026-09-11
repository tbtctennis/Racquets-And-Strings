import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FieldError } from '../../src/components/FieldError.tsx';
import { Input } from '../../src/components/Input.tsx';

const srcRoot = new URL('../../src/', import.meta.url);

const HAND_ROLLED_FIELD_ERROR = /<p\b[^>]*className="[^"]*text-badge-loss[^"]*"/;

const FORM_SITES = [
  '../../src/components/Input.tsx',
  '../../src/pages/Signup.tsx',
  '../../src/pages/tournament/ScoreModal.tsx',
  '../../src/features/events/EventsElements.tsx',
  '../../src/pages/marketplace/MarketplaceElements.tsx',
  '../../src/pages/services/ServicesElements.tsx',
  '../../src/features/profile/components/ProfileInfo.tsx',
  '../../src/pages/tournament/AddTeammatePanel.tsx',
  '../../src/features/tasks/CheckInModal.tsx',
  '../../src/components/ProfileCard.tsx',
  '../../src/pages/CourtMap.tsx',
];

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(full)));
    else if (/\.tsx$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('FieldError announces with role="alert" and the one error style', () => {
  const html = renderToStaticMarkup(React.createElement(FieldError, { id: 'email-error' }, 'Enter a valid email'));
  assert.match(html, /role="alert"/);
  assert.match(html, /id="email-error"/);
  assert.match(html, /mt-1\.5/);
  assert.match(html, /text-xs/);
  assert.match(html, /font-semibold/);
  assert.match(html, /text-badge-loss/);
  assert.match(html, /Enter a valid email/);
  assert.doesNotMatch(html, /ml-1/);
  assert.equal(renderToStaticMarkup(React.createElement(FieldError, null)), '');
});

test('Input renders FieldError and wires aria-describedby', () => {
  const html = renderToStaticMarkup(React.createElement(Input, { id: 'email', label: 'Email', error: 'Required' }));
  assert.match(html, /role="alert"/);
  assert.match(html, /id="email-error"/);
  assert.match(html, /aria-describedby="email-error"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /Required/);
  assert.doesNotMatch(html, /ml-1/);
});

test('every field error uses FieldError; hand-rolled field error paragraphs are gone', async () => {
  const files = await filesUnder(srcRoot.pathname);
  const leftovers = [];
  const consumers = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const rel = path.relative(srcRoot.pathname, file);
    if (rel === 'components/FieldError.tsx') continue;
    if (HAND_ROLLED_FIELD_ERROR.test(source)) leftovers.push(rel);
    if (/from ['"][^'"]*FieldError['"]/.test(source)) consumers.push(rel);
  }

  assert.deepEqual(
    leftovers.filter((rel) => rel !== 'pages/tournament/TournamentElements.tsx'),
    [],
  );
  assert.ok(consumers.length >= 8, `expected FieldError consumers, got ${consumers.join(', ')}`);

  for (const site of FORM_SITES) {
    const source = await readFile(new URL(site, import.meta.url), 'utf8');
    assert.doesNotMatch(source, HAND_ROLLED_FIELD_ERROR, `${site} still has a hand-rolled field error`);
  }

  const mustConsume = [
    '../../src/components/Input.tsx',
    '../../src/pages/Signup.tsx',
    '../../src/pages/tournament/ScoreModal.tsx',
    '../../src/features/events/EventsElements.tsx',
    '../../src/pages/services/ServicesElements.tsx',
    '../../src/features/profile/components/ProfileInfo.tsx',
  ];
  for (const site of mustConsume) {
    const source = await readFile(new URL(site, import.meta.url), 'utf8');
    if (site.endsWith('ProfileInfo.tsx')) {
      assert.match(source, /from ['"][^'"]*Input['"]/, `${site} should render field errors through Input`);
      continue;
    }
    assert.match(source, /<FieldError[\s>]/, `${site} is not a FieldError consumer`);
  }
});
