import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const css = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../../src/components/Layout.tsx', import.meta.url), 'utf8');
const app = await readFile(new URL('../../src/App.tsx', import.meta.url), 'utf8');

const TINT_TOKENS = [
  '--color-tint:',
  '--color-tint-hover:',
  '--color-tint-ghost:',
  '--color-tint-card:',
  '--color-tint-tone:',
];

function block(source, selector) {
  const start = source.indexOf(selector);
  assert.ok(start >= 0, `missing ${selector}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`unclosed ${selector}`);
}

function token(source, name) {
  const match = source.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match?.[1].trim() ?? null;
}

test('dark and light each have one page background, distinct from the card', () => {
  const theme = block(css, '@theme');
  const light = block(css, ":root[data-theme='light']");

  assert.equal(token(theme, '--color-page'), '#0b3027');
  assert.equal(token(light, '--color-page'), '#deded5');
  assert.equal(token(theme, '--color-tennis-surface'), '#143d34');
  assert.equal(token(light, '--color-tennis-surface'), '#ffffff');
  assert.notEqual(token(theme, '--color-page'), token(theme, '--color-tennis-surface'));
  assert.notEqual(token(light, '--color-page'), token(light, '--color-tennis-surface'));
  assert.equal(token(theme, '--color-tennis-deep'), '#06211b');
  assert.equal(token(light, '--color-tennis-deep'), '#d2d2c7');
});

test('five tints and one hairline are tokenised and follow fg/surface/clay', () => {
  const theme = block(css, '@theme');
  for (const name of TINT_TOKENS) {
    assert.match(theme, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.equal(token(theme, '--color-tint'), 'color-mix(in srgb, var(--color-fg) 5%, transparent)');
  assert.equal(token(theme, '--color-tint-hover'), 'color-mix(in srgb, var(--color-fg) 10%, transparent)');
  assert.equal(token(theme, '--color-tint-ghost'), 'color-mix(in srgb, var(--color-tennis-surface) 30%, transparent)');
  assert.equal(token(theme, '--color-tint-card'), 'var(--color-tennis-surface)');
  assert.equal(token(theme, '--color-tint-tone'), 'color-mix(in srgb, var(--color-clay) 10%, transparent)');
  assert.equal(token(theme, '--color-hairline'), 'color-mix(in srgb, var(--color-fg) 10%, transparent)');
  assert.equal((theme.match(/--color-hairline:/g) || []).length, 1);
  assert.equal((css.match(/--color-hairline:/g) || []).length, 1);
});

test('body, Layout, and the App loading wrapper use bg-page', () => {
  assert.match(css, /body\s*\{[^}]*@apply bg-page /s);
  assert.match(layout, /className="min-h-screen flex flex-col bg-page"/);
  assert.match(app, /bg-page/);
  assert.doesNotMatch(app, /bg-tennis-dark/);
});

test('TASK-578 clay and TASK-583 map tokens stay put', () => {
  const theme = block(css, '@theme');
  const light = block(css, ":root[data-theme='light']");
  assert.equal(token(theme, '--color-clay'), '#e84a27');
  assert.equal(token(theme, '--color-clay-fg'), '#ff8a65');
  assert.equal(token(light, '--color-clay'), '#ff6b35');
  assert.equal(token(light, '--color-clay-fg'), '#9e2d12');
  assert.equal(token(theme, '--color-map-active'), 'var(--color-green-700)');
  assert.equal(token(theme, '--color-map-programs'), 'var(--color-yellow-500)');
  assert.equal(token(theme, '--color-map-open'), 'var(--color-blue-500)');
  assert.equal(token(theme, '--color-map-club'), 'var(--color-orange-500)');
  assert.equal(token(theme, '--color-map-idle'), 'var(--color-slate-400)');
});
