import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

const ROOT = new URL('../../', import.meta.url);
const src = (relative) => readFile(new URL(relative, ROOT), 'utf8');

async function filesUnder(dir, predicate) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(full, predicate)));
    else if (predicate(entry.name, full)) files.push(full);
  }
  return files;
}

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const runtimePredicate = (name) => /\.(tsx?|jsx?|mjs)$/.test(name);

test('runtime source does not use friendly as a match type', async () => {
  const roots = ['src', 'functions', 'tests/fixtures'].map((rel) => new URL(rel, ROOT).pathname);
  const files = (await Promise.all(roots.map((dir) => filesUnder(dir, runtimePredicate)))).flat();
  const hits = [];
  for (const file of files) {
    const source = stripComments(await readFile(file, 'utf8'));
    if (/\bfriendl/i.test(source)) hits.push(path.relative(new URL('.', ROOT).pathname, file));
  }
  assert.deepEqual(hits, [], `friendly still used as a match type in ${hits.join(', ')}`);
});

test('member-facing copy does not use league as a city', async () => {
  const banned = [
    /your league profile/i,
    /create your league/i,
    /join(?:ing)? the league/i,
    /across the league/i,
    /pick a league or event/i,
  ];
  const roots = ['src', 'functions'].map((rel) => new URL(rel, ROOT).pathname);
  const files = (await Promise.all(roots.map((dir) => filesUnder(dir, runtimePredicate)))).flat();
  const hits = [];
  for (const file of files) {
    const source = stripComments(await readFile(file, 'utf8'));
    for (const pattern of banned) {
      if (pattern.test(source)) hits.push(`${path.relative(new URL('.', ROOT).pathname, file)} ${pattern}`);
    }
  }
  assert.deepEqual(hits, [], `league-as-city copy remains in ${hits.join(', ')}`);
});

test('member-facing copy dropped the machine-written tells', async () => {
  const banned = [/\bsimply\b/i, /\bseamlessly\b/i, /\beffortlessly\b/i, /\belevate\b/i, /\bempower\b/i];
  const roots = ['src', 'functions'].map((rel) => new URL(rel, ROOT).pathname);
  const files = (await Promise.all(roots.map((dir) => filesUnder(dir, runtimePredicate)))).flat();
  const hits = [];
  for (const file of files) {
    const source = stripComments(await readFile(file, 'utf8'));
    for (const pattern of banned) {
      if (pattern.test(source)) hits.push(`${path.relative(new URL('.', ROOT).pathname, file)} ${pattern}`);
    }
  }
  assert.deepEqual(hits, [], `banned filler remains in ${hits.join(', ')}`);
});

test('SPRINT-D7 example strings and leftover rally copy read like a person wrote them', async () => {
  const events = await src('src/features/events/EventsElements.tsx');
  const matchCard = await src('src/pages/tournament/MatchCard.tsx');
  const rr = await src('src/pages/tournament/RRGroupCard.tsx');
  const signup = await src('src/pages/Signup.tsx');
  const about = await src('src/pages/StaticPages.tsx');
  const email = await src('functions/lib/emailTemplates.js');
  const catalog = await src('src/features/tasks/taskCatalog.ts');

  assert.match(events, /Pick the courts you can get to\. We use these to put you in the right draw\./);
  assert.match(matchCard, /Matches you have not played become walkovers\. Played matches stay as they are\./);
  assert.match(rr, /Matches you have not played become walkovers\. Played matches stay as they are\./);
  assert.match(signup, /Create your profile to get match updates\./);
  assert.doesNotMatch(signup, /your league profile/);
  assert.match(about, /Pick an event that fits your level and schedule\./);
  assert.doesNotMatch(about, /Pick a league or event/);
  assert.match(email, /title: 'Rally Invite'/);
  assert.doesNotMatch(email, /rally rally/i);
  assert.doesNotMatch(email, /Rally Rally/);
  assert.doesNotMatch(email, /Your email is verified/);
  assert.doesNotMatch(catalog, /across the league/);
});
