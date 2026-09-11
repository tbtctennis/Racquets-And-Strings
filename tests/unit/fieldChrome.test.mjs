import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  field,
  fieldErrorBorderCls,
  fieldHintCls,
  fieldLabelCls,
  fieldRequiredCls,
  Input,
} from '../../src/components/Input.tsx';

const srcRoot = new URL('../../src/', import.meta.url);

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(full)));
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('Input is the one field chrome: label, asterisk, hint, error, 16px value', () => {
  const html = renderToStaticMarkup(
    React.createElement(Input, {
      id: 'full-name',
      label: 'Full Name',
      required: true,
      hint: 'First and last',
      error: 'Required',
    }),
  );
  assert.match(html, /for="full-name"/);
  assert.match(html, /id="full-name"/);
  assert.match(html, />Full Name</);
  assert.match(html, />\*<\/span>/);
  assert.match(html, /id="full-name-hint"/);
  assert.match(html, /First and last/);
  assert.match(html, /id="full-name-error"/);
  assert.match(html, /aria-describedby="full-name-hint full-name-error"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /min-h-11/);
  assert.match(html, /text-base/);
  assert.match(html, /placeholder-fg\/70/);
  assert.match(html, /border-badge-loss/);
  assert.doesNotMatch(html, /border-red-500/);
  assert.match(field, /min-h-11/);
  assert.match(field, /text-base/);
  assert.match(fieldLabelCls, /uppercase tracking-widest/);
  assert.match(fieldHintCls, /text-xs text-fg\/70/);
  assert.match(fieldRequiredCls, /text-clay-fg ml-0\.5/);
  assert.match(fieldErrorBorderCls, /border-badge-loss/);
});

test('SelectSheet still uses Input field chrome', async () => {
  const source = await readFile(new URL('../../src/components/SelectSheet.tsx', import.meta.url), 'utf8');
  assert.match(source, /from '\.\/Input'/);
  assert.match(source, /\bfield\b/);
  assert.match(source, /fieldLabelCls/);
  assert.match(source, /fieldRequiredCls/);
  assert.match(source, /<Sheet onClose=\{\(\) => setOpen\(false\)\} title=\{label\}/);
  assert.doesNotMatch(source, /<select[\s>]/);
});

test('remaining text fields use Input field classes; mixed chrome is gone', async () => {
  const leftovers = [];
  const asterisks = [];
  for (const file of await filesUnder(srcRoot.pathname)) {
    const source = await readFile(file, 'utf8');
    const rel = path.relative(srcRoot.pathname, file);
    if (rel === 'utils/eventDates.ts') continue;

    for (const match of source.matchAll(/<(input|textarea)\b/g)) {
      let i = match.index;
      let depth = 0;
      let quote = null;
      while (i < source.length) {
        const ch = source[i];
        if (quote) {
          if (ch === quote && source[i - 1] !== '\\') quote = null;
        } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
        else if (ch === '{') depth += 1;
        else if (ch === '}' && depth) depth -= 1;
        else if (ch === '>' && depth === 0) break;
        i += 1;
      }
      const tag = source.slice(match.index, i + 1);
      if (/\btype="(?:file|checkbox)"/.test(tag) || /\bhidden\b/.test(tag) || /className="hidden"/.test(tag)) {
        continue;
      }
      if (/bg-transparent/.test(tag) && /border-none/.test(tag)) continue;
      if (/bg-transparent/.test(tag) && rel === 'pages/CourtMap.tsx') continue;
      const usesField =
        /\bfield\b/.test(tag) ||
        /\bfieldCls\b/.test(tag) ||
        (rel === 'components/Input.tsx' && /className=\{cn\(/.test(tag));
      if (!usesField) leftovers.push(`${rel}:${tag.split('\n')[0]}`);
    }

    for (const match of source.matchAll(/\*\s*<\/span>/g)) {
      const around = source.slice(Math.max(0, match.index - 80), match.index);
      if (!/fieldRequiredCls/.test(around)) {
        asterisks.push(`${rel}: ${around.replace(/\s+/g, ' ').trim()}*`);
      }
    }
  }

  assert.deepEqual(leftovers, [], `text fields still mix chrome: ${leftovers.join(' | ')}`);
  assert.deepEqual(asterisks, [], `asterisks still mix chrome: ${asterisks.join(' | ')}`);

  const signup = await readFile(new URL('../../src/pages/Signup.tsx', import.meta.url), 'utf8');
  assert.match(signup, /endAdornment=/);
  assert.match(signup, /aria-label="Show password"/);
  assert.doesNotMatch(signup, /placeholder-fg\/40/);
  assert.doesNotMatch(signup, /border-red-500/);
});
