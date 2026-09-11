import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const css = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8');

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

test('light theme defines --color-clay and keeps --color-clay-fg at #9e2d12', () => {
  const light = block(css, ":root[data-theme='light']");
  assert.equal(token(light, '--color-clay'), '#ff6b35');
  assert.equal(token(light, '--color-clay-fg'), '#9e2d12');
});

test('dark theme keeps --color-clay at #e84a27', () => {
  const theme = block(css, '@theme');
  assert.equal(token(theme, '--color-clay'), '#e84a27');
  assert.equal(token(theme, '--color-clay-fg'), '#ff8a65');
});
