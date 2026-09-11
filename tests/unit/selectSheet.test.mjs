import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const srcRoot = fileURLToPath(new URL('../../src', import.meta.url));
const source = await readFile(new URL('../../src/components/SelectSheet.tsx', import.meta.url), 'utf8');

async function walkSourceFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkSourceFiles(path)));
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(path);
  }
  return out;
}

test('SelectSheet is a labelled modal form of 44px choices', () => {
  assert.match(source, /label: string/);
  assert.match(source, /<Sheet onClose=\{\(\) => setOpen\(false\)\} title=\{label\}/);
  assert.match(source, /<form/);
  assert.match(source, /aria-haspopup="dialog"/);
  assert.match(source, /aria-label=\{label\}/);
  assert.match(source, /role="option"/);
  assert.match(source, /popoverRowClassName/);
  assert.match(source, /from '\.\/Input'/);
  assert.doesNotMatch(source, /<select[\s>]/);
});

test('remaining dropdown call sites consume SelectSheet', async () => {
  const sites = {
    'pages/tournament/AddPlayerPanel.tsx': /import \{ SelectSheet \} from '\.\.\/\.\.\/components\/SelectSheet'/,
    'pages/tournament/RRGroupCard.tsx': /import \{ SelectSheet \} from '\.\.\/\.\.\/components\/SelectSheet'/,
    'pages/tournament/TournamentElements.tsx': /import \{ SelectSheet \} from '\.\.\/\.\.\/components\/SelectSheet'/,
    'pages/courtmap/CourtMapElements.tsx': /import \{ SelectSheet \} from '\.\.\/\.\.\/components\/SelectSheet'/,
    'features/events/EventsElements.tsx': /import \{ SelectSheet \} from '\.\.\/\.\.\/components\/SelectSheet'/,
    'pages/services/ServicesElements.tsx': /import \{ SelectSheet \} from '\.\.\/\.\.\/components\/SelectSheet'/,
    'pages/marketplace/MarketplaceElements.tsx': /import \{ SelectSheet \} from '\.\.\/\.\.\/components\/SelectSheet'/,
    'features/tasks/ClaimModal.tsx': /import \{ SelectSheet \} from '\.\.\/\.\.\/components\/SelectSheet'/,
  };

  for (const [rel, importRe] of Object.entries(sites)) {
    const file = await readFile(join(srcRoot, rel), 'utf8');
    assert.match(file, importRe, `${rel} must import SelectSheet`);
    assert.match(file, /<SelectSheet[\s\S]*label=/, `${rel} must render SelectSheet with a heading`);
    assert.doesNotMatch(file, /<select[\s>]/, `${rel} must not keep a native dropdown`);
  }

  const events = await readFile(join(srcRoot, 'features/events/EventsElements.tsx'), 'utf8');
  assert.equal([...events.matchAll(/<SelectSheet/g)].length, 2);

  const rr = await readFile(join(srcRoot, 'pages/tournament/RRGroupCard.tsx'), 'utf8');
  assert.match(rr, /<Switch/);
  assert.match(rr, /from '\.\.\/\.\.\/components\/Popover'/);

  const services = await readFile(join(srcRoot, 'pages/services/ServicesElements.tsx'), 'utf8');
  assert.match(services, /<Checkbox/);
});

test('no native dropdown remains in src ts/tsx', async () => {
  const leftovers = [];
  for (const path of await walkSourceFiles(srcRoot)) {
    const file = await readFile(path, 'utf8');
    if (!/<select[\s>]/.test(file)) continue;
    leftovers.push(relative(srcRoot, path));
  }
  assert.deepEqual(leftovers, []);
});

test('SelectSheet is registered with light and dark design-sync previews', async () => {
  const manifest = await readFile(new URL('../../.design-sync/config.json', import.meta.url), 'utf8');
  const entry = await readFile(new URL('../../.design-sync/entry.tsx', import.meta.url), 'utf8');

  assert.match(manifest, /"SelectSheet": "src\/components\/SelectSheet\.tsx"/);
  assert.match(manifest, /"SelectSheet": "\.design-sync\/entry\.tsx#SelectSheet"/);
  assert.match(manifest, /"themes": \["light", "dark"\]/);
  assert.match(entry, /SelectSheet: \(\{ theme \}: \{ theme: 'light' \| 'dark' \}\)/);
  assert.match(entry, /label="Condition"/);
});
