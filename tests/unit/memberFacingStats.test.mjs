import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { streakFromMatches } from '../../src/components/ProfileCard.tsx';

const load = (rel) => readFile(new URL(rel, import.meta.url), 'utf8');

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

test('streak derivation lives on ProfileCard and formats 2W / 2L', () => {
  assert.equal(streakFromMatches([]), '—');
  assert.equal(streakFromMatches([{ won: true }, { won: true }, { won: false }]), '2W');
  assert.equal(streakFromMatches([{ won: false }, { won: false }]), '2L');
});

test('leaderboard row shows matches won, P/G won %, rank move and streak', async () => {
  const leagues = await load('../../src/pages/Leagues.tsx');
  const tournament = leagues.slice(
    leagues.indexOf("{board === 'tournament'"),
    leagues.indexOf('{/* ── Community board'),
  );
  const statsStart = tournament.indexOf('stats={[');
  const stats = tournament.slice(statsStart, tournament.indexOf(']}', statsStart) + 2);

  assert.match(leagues, /import \{ streakFromMatches \} from '\.\.\/components\/ProfileCard'/);
  assert.match(stats, /label: 'Wins'/);
  assert.match(stats, /label: 'P\/G Won %'/);
  assert.match(stats, /label: 'Rank Move'/);
  assert.match(stats, /label: 'Streak'/);
  assert.match(stats, /isUser \? userStreak : '—'/);
  assert.doesNotMatch(stats, /Matches Won/);
  assert.doesNotMatch(stats, /P\/G Played/);
  assert.doesNotMatch(stats, /Matches Played/);
  assert.doesNotMatch(stats, /label: 'MP'/);
});

test('RR table shows group wins, overall P/G won %, pending and contact', async () => {
  const rr = await load('../../src/pages/tournament/RRGroupCard.tsx');
  const tiles = rr.slice(rr.indexOf('{standings.length > 0'), rr.indexOf('tap a player to contact'));
  const labels = [...tiles.matchAll(/label: '([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(labels, ['Wins', 'P/G Won %', 'Pending', 'Contact']);
  assert.match(tiles, /row\.matchWins/);
  assert.match(tiles, /theirPending/);
  assert.doesNotMatch(tiles, /label: 'MP'/);
  assert.doesNotMatch(tiles, /st\.matchesPlayed/);
  assert.doesNotMatch(tiles, /P\/G Played/);
});

test('upcoming match cards list pending fixtures and add no extra stats', async () => {
  const profile = await load('../../src/pages/Profile.tsx');
  const upcoming = profile.slice(profile.indexOf('Upcoming matches'), profile.indexOf('Community Member Initiation'));
  const source = stripComments(upcoming);

  assert.match(upcoming, /<PlayerCard/);
  assert.doesNotMatch(source, /stats=\{/);
  assert.doesNotMatch(source, /P\/G Won %/);
  assert.doesNotMatch(source, /Rank Move/);
  assert.doesNotMatch(source, /Matches Won/);
  assert.doesNotMatch(source, /P\/G Played/);
  assert.doesNotMatch(profile, /useStandings\(/);
});
