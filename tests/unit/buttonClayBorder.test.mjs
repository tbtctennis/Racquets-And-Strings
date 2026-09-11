import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

const variantValue = (source, name) => {
  const match = source.match(new RegExp(`${name}:\\s*([^,\\n]+),`));
  assert.ok(match, `missing ${name} variant`);
  return match[1].trim();
};

test('the three button clay-border sites are cleared and the box does not move', async () => {
  const button = await load('../../src/components/Button.tsx');
  const contact = await load('../../src/components/ContactOpponentButton.tsx');
  const courtMap = await load('../../src/pages/CourtMap.tsx');

  assert.match(button, /border border-transparent/);
  assert.doesNotMatch(button, /border-clay/);
  assert.equal(variantValue(button, 'outline'), variantValue(button, 'ghost'));

  const outlinePill = contact.match(/return `\$\{base\} border [^`]+`/);
  assert.ok(outlinePill, 'missing outline pill class');
  assert.doesNotMatch(outlinePill[0], /border-clay/);
  assert.match(outlinePill[0], /border border-transparent/);

  const reportClass =
    /className="shrink-0 px-3 py-1\.5 rounded-xl border border-transparent text-clay-fg text-xs font-semibold hover:bg-clay\/10 transition-colors"/;
  assert.match(courtMap, reportClass);
  assert.doesNotMatch(courtMap, /rounded-xl border border-clay/);
});

test('Input focus border and spinner rings stay clay', async () => {
  const input = await load('../../src/components/Input.tsx');
  const spinner = await load('../../src/components/Spinner.tsx');

  assert.match(input, /focus:border-clay/);
  assert.match(spinner, /clay: 'border-clay'/);
  assert.match(spinner, /border-t-transparent/);
});
