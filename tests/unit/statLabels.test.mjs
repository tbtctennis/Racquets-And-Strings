import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

test('P/G Won %, Wins, Matches and Group Pts replace the drifted pair on every surface', async () => {
  const leagues = await load('../../src/pages/Leagues.tsx');
  const rr = await load('../../src/pages/tournament/RRGroupCard.tsx');
  const profileCard = await load('../../src/components/ProfileCard.tsx');
  const matches = await load('../../src/pages/Matches.tsx');
  const doubles = await load('../../src/features/partnerPool/doublesPoolStats.ts');
  const playerProfile = await load('../../src/pages/PlayerProfile.tsx');
  const profile = await load('../../src/pages/Profile.tsx');

  assert.match(leagues, /label: 'P\/G Won %'/);
  assert.doesNotMatch(leagues, /P\/G Win %/);
  assert.match(rr, /label: 'P\/G Won %'/);
  assert.match(profileCard, /label="P\/G Won %"/);
  assert.match(matches, /label: 'P\/G Won %'/);
  assert.match(doubles, /'P\/G Won %'/);

  const tournament = leagues.slice(
    leagues.indexOf("{board === 'tournament'"),
    leagues.indexOf('{/* ── Community board'),
  );
  const statsStart = tournament.indexOf('stats={[');
  const stats = tournament.slice(statsStart, tournament.indexOf(']}', statsStart) + 2);
  assert.match(stats, /label: 'Wins'/);
  assert.doesNotMatch(stats, /Matches Won/);
  assert.match(rr, /label: 'Wins'/);
  assert.match(doubles, /'Wins'/);

  assert.match(leagues, /label: 'Matches'/);
  assert.match(playerProfile, /label: 'Matches'/);
  assert.match(profile, />Matches</);
  assert.doesNotMatch(stats, /label: 'MP'/);
  assert.doesNotMatch(rr, /label: 'MP'/);

  assert.match(rr, /\{row\.points\} Group Pts/);
  assert.doesNotMatch(rr, /\{row\.points\} pts/);
});

test('Contact replaces Phone, and rank move renders once per leaderboard row', async () => {
  const leagues = await load('../../src/pages/Leagues.tsx');
  const rr = await load('../../src/pages/tournament/RRGroupCard.tsx');
  const profileCard = await load('../../src/components/ProfileCard.tsx');
  const profileInfo = await load('../../src/features/profile/components/ProfileInfo.tsx');
  const tasks = await load('../../src/features/tasks/useTasks.ts');

  assert.match(rr, /label: 'Contact'/);
  assert.match(profileCard, /header\('contact', null, 'Contact'\)/);
  assert.match(profileInfo, /label="Contact"/);
  assert.match(tasks, /missing\.push\('Contact'\)/);
  assert.doesNotMatch(profileCard, />Phone</);
  assert.doesNotMatch(tasks, /missing\.push\('Phone'\)/);

  const tournament = leagues.slice(
    leagues.indexOf("{board === 'tournament'"),
    leagues.indexOf('{/* ── Community board'),
  );
  const statsStart = tournament.indexOf('stats={[');
  const stats = tournament.slice(statsStart, tournament.indexOf(']}', statsStart) + 2);
  assert.equal([...stats.matchAll(/label: 'Rank Move'/g)].length, 1);
  assert.doesNotMatch(tournament, /trailing=\{<RankMove/);
  assert.match(tournament, /subtitle=\{`Skill \$\{row\.skill_level\} · \$\{skillBand\(row\.skill_level\)\}`\}/);
});

test('court player counts and the two draw counts keep one label each', async () => {
  const place = await load('../../src/components/PlaceCard.tsx');
  const courts = await load('../../src/pages/courtmap/CourtMapElements.tsx');
  const tournamentEls = await load('../../src/pages/tournament/TournamentElements.tsx');

  assert.match(place, /\{court\.count\} player\{court\.count !== 1 \? 's' : ''\}/);
  assert.doesNotMatch(place, /active player/);
  assert.match(courts, /\{c\.count\} player\{c\.count !== 1 \? 's' : ''\}/);

  assert.match(tournamentEls, /players registered/);
  assert.match(tournamentEls, /\$\{signedUp\} signed up/);
});
