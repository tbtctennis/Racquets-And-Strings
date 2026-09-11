import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');

const collectSource = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectSource(fullPath)));
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
};

test('the client does not write league points, task payouts, or the spend ledger', async () => {
  const files = await collectSource(srcRoot);
  const writeCall =
    /(?:setDoc|updateDoc|addDoc|batch\.(?:set|update))\([\s\S]{0,500}?\b(leaguePoints26|bonusPoints|pointsSpent|setupComplete)\s*:/;

  for (const file of files) {
    const rel = path.relative(srcRoot, file).replaceAll('\\', '/');
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, writeCall, `${rel} writes a Functions-owned payout field`);
    assert.doesNotMatch(
      source,
      /(?:setDoc|updateDoc|addDoc)\(\s*doc\(\s*db,\s*['"]offers['"]/,
      `${rel} writes offers/*`,
    );
    assert.doesNotMatch(
      source,
      /(?:setDoc|updateDoc|addDoc)\(\s*doc\(\s*db,\s*['"]redemptions['"]/,
      `${rel} writes redemptions/*`,
    );
  }

  const bootstrap = await readFile(new URL('../../src/lib/profileBootstrap.ts', import.meta.url), 'utf8');
  assert.match(bootstrap, /leaguePoints26:\s*0/);
  assert.doesNotMatch(bootstrap, /leaguePoints26:\s*[1-9]/);

  const tasks = await readFile(new URL('../../src/features/tasks/useTasks.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(tasks, /bumpCounter/);
  assert.doesNotMatch(tasks, /\bincrement\b/);
  assert.match(tasks, /setTaskDone/);

  const redeem = await readFile(new URL('../../src/features/services/servicesApi.ts', import.meta.url), 'utf8');
  assert.match(redeem, /httpsCallable[\s\S]*redeemReward/);
});
