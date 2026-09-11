const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');

const read = (id) => readFileSync(require.resolve(id), 'utf8');

test('beta notification triggers have no outbound email path', () => {
  const source = read('../notifications');
  assert.doesNotMatch(source, /sendEmail/);
  assert.match(read('../lib/weeklyReminders'), /type: 'reminder_incomplete_matches'/);
});

test('notify() writes in-app records and does not send email', () => {
  const source = read('../lib/notify');
  const start = source.indexOf('async function notify');
  const end = source.indexOf('async function adminUids');
  const notifyFn = source.slice(start, end);
  assert.match(notifyFn, /collection\('notifications'\)/);
  assert.doesNotMatch(notifyFn, /sendEmail/);
  assert.doesNotMatch(notifyFn, /Resend/);
});

test('sendEmail stays off on staging unless the allowlist switch is on', () => {
  const source = read('../lib/notify');
  assert.match(source, /emailDeliveryDecision/);
  assert.match(source, /EMAIL_DELIVERY_ENABLED === 'true'/);
  assert.match(source, /EMAIL_ALLOWED_RECIPIENTS/);
  assert.match(source, /if \(!decision\.deliver\)/);
});

test('weekly reminders itemize opponents via bounded getAll and notifyOnce', () => {
  const source = read('../notifications');
  assert.match(source, /pendingMatchNotices/);
  assert.match(source, /incompleteMatchNotices/);
  assert.match(source, /getAllByIds\('users', opponentReadIds/);
  assert.match(source, /getAllByIds\('events', eventReadIds/);
  assert.match(source, /boundedReadChunks/);
  assert.match(source, /notifyOnce\(n\.key, n\.uid, n\.payload\)/);
  assert.doesNotMatch(source, /Earliest deadline/);
});

test('in-app writers emit zone-change, decline, dispute, and result notices', () => {
  const zone = read('../zoneMoves');
  const notes = read('../notifications');
  const challengeNotes = read('../lib/challengeNotifications');
  const tournament = read('../tournamentResults');
  const competition = read('../competitionResults');

  assert.match(zone, /type: 'organizer_zone_change_request'/);
  assert.match(challengeNotes, /type: 'ladder_declined'/);
  assert.match(notes, /type: 'rally_declined'/);
  assert.match(challengeNotes, /type: 'challenge_conversion_rejected'/);
  assert.match(challengeNotes, /type: 'ladder_reported'/);
  assert.match(challengeNotes, /type: 'ladder_denied'/);
  assert.match(notes, /challengeLifecycleNotices/);
  assert.match(notes, /notifyOnce\(n\.key, n\.uid, n\.payload\)/);
  assert.match(notes, /type: 'ladder_cancelled'/);
  assert.match(read('../matchCancel'), /acceptedCancellationNotice/);
  assert.match(tournament, /type: 'organizer_score_disputed'/);
  assert.match(tournament, /type: winner \? 'tournament_result_recorded' : 'tournament_score_recorded'/);
  assert.match(competition, /type: 'organizer_score_disputed'/);
});
