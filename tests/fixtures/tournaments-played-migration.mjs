import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { backfillTournamentsPlayed, planTournamentPlayedUpdates } from '../../scripts/lib/tournaments-played.mjs';

const projectId = process.env.FIREBASE_EMULATOR_PROJECT_ID || 'rands-local';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || '';
if (projectId !== 'rands-local' || !/^(localhost|127\.0\.0\.1):\d+$/.test(firestoreHost)) {
  throw new Error('This migration fixture only runs against the rands-local Firestore emulator.');
}

const app = initializeApp({ projectId }, 'tournaments-played-migration');
const db = getFirestore(app);
const quiet = { log() {} };

try {
  const [statsSnap, participantsSnap, eventsSnap] = await Promise.all([
    db.collection('stats').get(),
    db.collection('event_participants').get(),
    db.collection('events').get(),
  ]);
  const stats = statsSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const participants = participantsSnap.docs.map((doc) => doc.data());
  const events = eventsSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const expected = new Map(
    planTournamentPlayedUpdates(stats, participants, events).map(({ id, expected: count }) => [id, count]),
  );
  const shouldChange = stats
    .filter((stat) => stat.data.tournamentsPlayed !== expected.get(stat.id))
    .map((stat) => stat.id);

  const dryRun = await backfillTournamentsPlayed(db, { dryRun: true, logger: quiet });
  assert.ok(dryRun.planned > 0, 'seeded stats should produce a visible backfill diff');
  assert.deepEqual(
    dryRun.updates.map(({ id }) => id),
    shouldChange,
  );
  const stillUnchanged = await db.collection('stats').get();
  stillUnchanged.docs.forEach((doc) => assert.equal(doc.data().tournamentsPlayed, undefined));

  const applied = await backfillTournamentsPlayed(db, { dryRun: false, logger: quiet });
  assert.equal(applied.changed, dryRun.planned);
  const after = await db.collection('stats').get();
  after.docs.forEach((doc) => assert.equal(doc.data().tournamentsPlayed, expected.get(doc.id) || 0));

  const repeat = await backfillTournamentsPlayed(db, { dryRun: true, logger: quiet });
  assert.equal(repeat.planned, 0, 'an applied backfill must be idempotent');
  console.log(`tournamentsPlayed migration fixture passed: ${dryRun.planned} diff(s), ${applied.changed} applied.`);
} finally {
  await deleteApp(app);
}
