import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const D1_LIVE = [
  'Button',
  'Input',
  'PlayerCard',
  'Accordion',
  'AlertMessage',
  'AvailabilityPills',
  'ContactOpponentButton',
  'Fab',
  'LoadingBar',
  'NearbyPill',
  'RacquetIcon',
  'SegmentedControl',
  'Sheet',
  'Toast',
  'Tree',
];

const previewFn = (name) => new RegExp(`${name}: \\(\\{ theme \\}: \\{ theme: 'light' \\| 'dark' \\}\\)`);

test('every remaining D1 design-sync row is registered light/dark or superseded', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8'));
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.deepEqual(manifest.themes, ['light', 'dark']);

  for (const name of D1_LIVE) {
    assert.equal(manifest.componentSrcMap[name], `src/components/${name}.tsx`, `${name} src`);
    assert.equal(manifest.previews[name], `.design-sync/entry.tsx#${name}`, `${name} preview`);
    assert.match(entry, previewFn(name), `${name} preview fn`);
  }

  assert.equal(manifest.componentSrcMap.Stepper, undefined);
  assert.equal(manifest.previews.Stepper, undefined);
  assert.doesNotMatch(entry, /from '\.\.\/src\/components\/Stepper'/);
  assert.doesNotMatch(entry, /Stepper: \(\{ theme \}/);
  assert.equal(manifest.superseded.Stepper.row, 'DC-18');
  assert.match(manifest.superseded.Stepper.reason, /Deleted in D2 R-5/);
  assert.equal(manifest.superseded.pendingGrade.row, 'DC-19');
  assert.match(manifest.superseded.pendingGrade.reason, /Button, Input, and PlayerCard/);
  assert.equal(manifest.superseded.previewsDir.row, 'DC-16');
});

test('D1 Button preview uses current variants and the Target44 guide', async () => {
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');
  const buttonPreview = entry.slice(entry.indexOf('Button: ({ theme }'), entry.indexOf('Input: ({ theme }'));

  assert.match(buttonPreview, /variant="clay"/);
  assert.match(buttonPreview, /variant="outline"/);
  assert.doesNotMatch(buttonPreview, /variant="danger"/);
  assert.doesNotMatch(buttonPreview, /variant="primary"/);
  assert.doesNotMatch(buttonPreview, /size="lg"/);
  assert.match(entry, /data-guide="Target44"/);
  assert.match(entry, /h-11 border border-badge-loss/);
});
