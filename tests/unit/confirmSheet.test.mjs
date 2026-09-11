import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../../src/components/ConfirmSheet.tsx', import.meta.url), 'utf8');

test('ConfirmSheet exposes a labelled yes/no confirmation surface', () => {
  assert.match(source, /title: string/);
  assert.match(source, /message: React\.ReactNode/);
  assert.match(source, /<Sheet onClose=\{onClose\} title=\{title\}/);
  assert.match(source, /confirmLabel = 'Confirm'/);
  assert.match(source, /cancelLabel = 'Cancel'/);
  assert.match(source, /<Button type="button" variant="outline" onClick=\{onClose\}/);
  assert.match(source, /<Button type="submit" disabled=\{disabled\}/);
});

test('ConfirmSheet submits through the affirmative action and protects loading/disabled states', () => {
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /if \(!disabled\) onConfirm\(\)/);
  assert.match(source, /const disabled = isLoading \|\| confirmDisabled/);
  assert.match(source, /isLoading=\{isLoading\}/);
});
