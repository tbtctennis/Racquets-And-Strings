/**
 * Notification triggers.
 *
 * Every notification is created here, server-side, so it reaches people who weren't the one
 * clicking (and so players can't write into each other's feeds — see firestore.rules).
 * Firestore triggers cover things that happen; scheduled jobs cover time-based reminders.
 *
 * Deployment is environment-gated. Follow docs/architecture/ENVIRONMENTS_AND_DEPLOYMENT.md;
 * do not use a bare Firebase deploy command from this checkout.
 */
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { notify } = require('./lib/notify');

const { TZ, REGION } = require('./lib/constants');
const { challengeLifecycleNotices } = require('./lib/challengeNotifications');
const {
  boundedReadChunks,
  eventReadIds,
  incompleteMatchNotices,
  opponentReadIds,
  pendingMatchNotices,
  reminderWeekKey,
} = require('./lib/weeklyReminders');
const db = () => admin.firestore();
const nodeCrypto = require('node:crypto');

const eventOrganizerUids = (event) => [
  ...new Set(
    [
      event?.creator_id,
      ...(event?.organizer_ids || []),
      ...(event?.assigned_organizer_uids || []),
      ...(event?.organizer_uids || []),
    ].filter(Boolean),
  ),
];

// Stable notification ids make Firestore retries harmless for draw/group notices. The normal
// notify() helper intentionally creates a new feed item each time; these lifecycle notices need
// stronger idempotency because a draw is assembled across many match documents.
const notifyOnce = async (key, recipients, payload) => {
  const ids = [...new Set((Array.isArray(recipients) ? recipients : [recipients]).filter(Boolean))];
  if (!ids.length) return;
  const refs = ids.map((uid) =>
    db()
      .collection('notifications')
      .doc(nodeCrypto.createHash('sha1').update(`${key}:${uid}`).digest('hex')),
  );
  const existing = await db().getAll(...refs);
  const batch = db().batch();
  refs.forEach((ref, i) => {
    if (!existing[i].exists) {
      batch.set(ref, { uid: ids[i], read: false, created_at: new Date().toISOString(), ...payload });
    }
  });
  if (refs.some((_, i) => !existing[i].exists)) await batch.commit();
};

const notifyJoinDigest = async (eventData, participant) => {
  const day = new Date().toISOString().slice(0, 10);
  const title = eventData.title || 'your event';
  await Promise.all(
    eventOrganizerUids(eventData).map(async (uid) => {
      const ref = db()
        .collection('notifications')
        .doc(nodeCrypto.createHash('sha1').update(`join-digest:${participant.event_id}:${day}:${uid}`).digest('hex'));
      await db().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const count = (snap.exists ? snap.data().count || 0 : 0) + 1;
        tx.set(ref, {
          uid,
          read: false,
          created_at: snap.exists ? snap.data().created_at : new Date().toISOString(),
          type: 'organizer_event_roster',
          title: `${count} player${count === 1 ? '' : 's'} joined ${title} today`,
          body: `${count === 1 ? participant.user_name || 'A player' : `${count} players`} joined today.`,
          link: '/events',
          count,
        });
      });
    }),
  );
};

const matchPlayers = (m) => [m.player_1_uid, m.player_2_uid].filter(Boolean);
const opponentName = (m, uid) => (m.player_1_uid === uid ? m.player_2_name : m.player_1_name);
const matchLink = (m) => `/tournament?event=${m.event_id}`;
// Preview/placeholder docs never represent a real fixture.
const isRealMatch = (id, m) => !id.startsWith('preview_') && !id.startsWith('ll_preview_') && !!m.event_id;

async function getAllByIds(collection, ids) {
  const map = new Map();
  for (const chunk of boundedReadChunks(ids)) {
    const snaps = await db().getAll(...chunk.map((id) => db().doc(`${collection}/${id}`)));
    snaps.forEach((snap) => map.set(snap.id, snap.exists ? snap.data() : {}));
  }
  return map;
}

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

// ─── Matches ────────────────────────────────────────────────────────────────

// A new match doc = the draw is out (or a group was formed). Tell both named players.
exports.onMatchCreated = onDocumentCreated({ document: 'matches/{matchId}', region: REGION }, async (event) => {
  const m = event.data?.data();
  if (!m || (m.category !== 'singles' && m.category !== 'doubles')) return;
  if (!isRealMatch(event.params.matchId, m)) return;
  const players = matchPlayers(m);
  if (players.length === 0) return;

  const isRR = !!m.rr_group || m.format === 'rr';
  const drawKey = m.draw_id || m.drawId || m.draw_type || m.format || 'draw';
  await notifyOnce(`draw:${m.event_id}:${drawKey}:${isRR ? `group:${m.rr_group ?? 'unknown'}` : 'knockout'}`, players, {
    type: isRR ? 'group_assigned' : 'draw_published',
    title: isRR ? 'You’ve been placed in a group' : 'The draw is out',
    body: isRR ? 'Your Round Robin group fixtures are ready.' : 'Your tournament fixtures are ready.',
    link: matchLink(m),
  });
});

// Schedule set/changed, score recorded, and advancement into an empty slot.
exports.onMatchUpdated = onDocumentUpdated({ document: 'matches/{matchId}', region: REGION }, async (event) => {
  const before = event.data?.before.data() || {};
  const after = event.data?.after.data() || {};
  if (after.category !== 'singles' && after.category !== 'doubles') return;
  if (!isRealMatch(event.params.matchId, after)) return;

  // Organizer set or changed the date — the highest-value notification in the app.
  const dateChanged = before.proposed_date !== after.proposed_date || before.proposed_slot !== after.proposed_slot;
  if (after.schedule_status === 'scheduled' && after.proposed_date && dateChanged) {
    const when = `${fmtDate(after.proposed_date)}${after.proposed_slot ? ` ${after.proposed_slot}` : ''}`;
    await Promise.all(
      matchPlayers(after).map((uid) =>
        notify(uid, {
          type: 'match_scheduled',
          title: before.schedule_status === 'scheduled' ? 'Your match time changed' : 'Your match has been scheduled',
          body: `${when}${opponentName(after, uid) ? ` vs ${opponentName(after, uid)}` : ''}`,
          link: matchLink(after),
        }),
      ),
    );
  }

  // Advancement: an empty player slot became filled — the next-round pairing is known.
  const slots = ['player_1_uid', 'player_2_uid'];
  const newlyFilled = slots.some((s) => !before[s] && after[s]);
  const bothSet = after.player_1_uid && after.player_2_uid;
  if (newlyFilled && bothSet && after.status !== 'complete') {
    await Promise.all(
      matchPlayers(after).map((uid) =>
        notify(uid, {
          type: 'match_advanced',
          title: 'Your next opponent is ready',
          body: opponentName(after, uid) ? `You play ${opponentName(after, uid)}` : '',
          link: matchLink(after),
        }),
      ),
    );
  }
});

// ─── Scores ─────────────────────────────────────────────────────────────────

// A player submitted a score: alert the organizer to confirm, and the opponent that a result
// was claimed against them.
exports.onScoreSubmitted = onDocumentCreated({ document: 'matches/{id}', region: REGION }, async (event) => {
  const s = event.data?.data();
  if (!s || s.category !== 'score_submission') return;
  if (!s.event_id) return;
  const eventDoc = await db().doc(`events/${s.event_id}`).get();
  const organizerIds = eventDoc.exists ? eventOrganizerUids(eventDoc.data()) : [];
  const link = `/tournament?event=${s.event_id}`;

  await notify(organizerIds, {
    type: 'organizer_score_pending',
    title: 'A score needs your approval',
    body: `${s.player_1_name || ''} vs ${s.player_2_name || ''}`.trim(),
    link,
  });
});

// Submissions are deleted on both confirm and reject. A confirm also flips the match to
// complete (covered by onMatchUpdated), so only tell the submitter when it was NOT applied.
exports.onScoreSubmissionResolved = onDocumentDeleted({ document: 'matches/{id}', region: REGION }, async (event) => {
  const s = event.data?.data();
  if (!s || s.category !== 'score_submission') return;
  if (!s.submitted_by || !s.match_id) return;
  const matchDoc = await db().doc(`matches/${s.match_id}`).get();
  if (!matchDoc.exists) return;
  const m = matchDoc.data();
  // Applied => the match now has this winner recorded. Otherwise it was rejected.
  if (m.status === 'complete' && m.winner_uid === s.claimed_winner_uid) return;

  await notify(s.submitted_by, {
    type: 'score_rejected',
    title: 'Your score submission was rejected',
    body: 'The organizer didn’t accept the reported result. Please re-submit the correct score.',
    link: `/tournament?event=${s.event_id}`,
  });
});

// ─── Scheduling assistance ──────────────────────────────────────────────────

// Replaces the old client-side write: the player's request now notifies the organizer here.
exports.onScheduleRequested = onDocumentUpdated({ document: 'matches/{matchId}', region: REGION }, async (event) => {
  const before = event.data?.before.data() || {};
  const after = event.data?.after.data() || {};
  if (after.category !== 'singles' && after.category !== 'doubles') return;
  if (before.schedule_requested === true || after.schedule_requested !== true) return;
  if (!isRealMatch(event.params.matchId, after)) return;

  const eventDoc = await db().doc(`events/${after.event_id}`).get();
  if (!eventDoc.exists) return;
  await notify(eventOrganizerUids(eventDoc.data()), {
    type: 'organizer_schedule_request',
    title: 'A player asked you to schedule a match',
    body: `${after.player_1_name || ''} vs ${after.player_2_name || ''}`.trim(),
    link: `/tournament?event=${after.event_id}`,
  });
});

// ─── League Ladder ──────────────────────────────────────────────────────────

exports.onLadderChallengeCreated = onDocumentCreated({ document: 'matches/{id}', region: REGION }, async (event) => {
  const c = event.data?.data();
  if (!c || c.category !== 'challenge') return;
  if (!c.player_2_uid) return;
  // A conversion proposal (source set) is a distinct ask from a from-scratch challenge —
  // the opponent already played the match and is being asked to confirm it counts.
  if (c.source) {
    await notify(c.player_2_uid, {
      type: 'challenge_conversion_proposed',
      title: `${c.player_1_name || 'A player'} converted your match to a challenge`,
      body: 'Review and confirm the result to register it as a challenge.',
      link: '/matches?mode=challenges',
    });
  } else {
    await notify(c.player_2_uid, {
      type: 'ladder_challenged',
      title: `${c.player_1_name || 'A player'} challenged you`,
      body: 'Arrange a time and report the result when you’ve played.',
      link: '/matches?mode=challenges',
    });
  }
});

exports.onLadderChallengeUpdated = onDocumentUpdated({ document: 'matches/{id}', region: REGION }, async (event) => {
  const before = event.data?.before.data() || {};
  const after = event.data?.after.data() || {};
  if (after.category !== 'challenge') return;
  const link = '/matches?mode=challenges';

  // Opponent accepted a from-scratch challenge (not a conversion — those go straight from
  // 'open' to 'reported' and already have their own "conversion proposed" notification).
  if (before.status === 'open' && after.status === 'accepted' && !after.source) {
    await notify(after.player_1_uid, {
      type: 'ladder_accepted',
      title: `${after.player_2_name || 'Your opponent'} accepted your challenge`,
      body: 'Arrange a time and report the result when you’ve played.',
      link,
    });
  }

  // Declined / confirmed / denied are idempotent: Firestore retries must not duplicate the
  // in-app row. Denied is a score_disputed flip, so it is not gated on a status change.
  const notices = challengeLifecycleNotices(before, after, event.params.id);
  await Promise.all(notices.map((n) => notifyOnce(n.key, n.uid, n.payload)));
});

// Challenger cancelled an open challenge — the opponent's pending challenge disappeared.
exports.onLadderChallengeDeleted = onDocumentDeleted({ document: 'matches/{id}', region: REGION }, async (event) => {
  const c = event.data?.data();
  if (!c || c.category !== 'challenge' || c.status !== 'open' || !c.player_2_uid) return;
  await notify(c.player_2_uid, {
    type: 'ladder_cancelled',
    title: `${c.player_1_name || 'A player'} cancelled their challenge`,
    link: '/matches?mode=challenges',
  });
});

// ─── Rallies (rallies) ───────────────────────────────────────────────────
// Same shape as the ladder-challenge triggers, minus points/organizer steps.

exports.onRallyCreated = onDocumentCreated({ document: 'matches/{id}', region: REGION }, async (event) => {
  const r = event.data?.data();
  if (!r || r.category !== 'rally') return;
  if (!r.player_2_uid) return;
  await notify(r.player_2_uid, {
    type: 'rally_requested',
    title: `${r.player_1_name || 'A player'} wants to rally`,
    body: 'Accept to set up a rally match.',
    link: '/matches?mode=rallies',
  });
});

exports.onRallyUpdated = onDocumentUpdated({ document: 'matches/{id}', region: REGION }, async (event) => {
  const before = event.data?.before.data() || {};
  const after = event.data?.after.data() || {};
  if (after.category !== 'rally') return;
  if (before.status === after.status || !after.player_1_uid) return;
  if (after.status === 'accepted') {
    await notify(after.player_1_uid, {
      type: 'rally_accepted',
      title: `${after.player_2_name || 'Your rally partner'} is in. Rally on!`,
      body: 'Arrange a time and court together.',
      link: '/matches?mode=rallies',
    });
  } else if (after.status === 'declined') {
    await notify(after.player_1_uid, {
      type: 'rally_declined',
      title: `${after.player_2_name || 'That player'} can’t rally right now`,
      link: '/matches?mode=rallies',
    });
  } else if (after.status === 'complete') {
    const winner = after.winner_uid || after.claimed_winner_uid;
    await Promise.all(
      [after.player_1_uid, after.player_2_uid].filter(Boolean).map((uid) =>
        notify(uid, {
          type: 'rally_completed',
          title: 'Rally match recorded',
          body: uid === winner ? 'You picked up 2 points.' : 'You picked up 1 point.',
          link: '/matches?mode=rallies',
        }),
      ),
    );
  }
});

exports.onRallyDeleted = onDocumentDeleted({ document: 'matches/{id}', region: REGION }, async (event) => {
  const r = event.data?.data();
  if (!r || r.category !== 'rally' || r.status !== 'open' || !r.player_2_uid) return;
  await notify(r.player_2_uid, {
    type: 'rally_cancelled',
    title: `${r.player_1_name || 'A player'} withdrew their rally request`,
    link: '/matches?mode=rallies',
  });
});

// ─── Tasks ──────────────────────────────────────────────────────────────────

exports.onTaskProgressUpdated = onDocumentUpdated({ document: 'tasks/{uid}', region: REGION }, async (event) => {
  const before = event.data?.before.data() || {};
  const after = event.data?.after.data() || {};
  const uid = event.params.uid;

  if (!before.setupComplete && after.setupComplete) {
    await notify(uid, {
      type: 'initiation_complete',
      title: 'Community Member Initiation complete. 25 points',
      body: 'Your points are on the Community leaderboard.',
      link: '/leagues',
    });
    return;
  }

  // A task the organizer took back.
  const revoked = Object.keys(after).find((k) => before[k] === true && after[k] === false && k !== 'setupComplete');
  if (revoked) {
    await notify(uid, {
      type: 'task_revoked',
      title: 'A task was removed from your Initiation',
      body: 'An administrator reviewed a claimed task. Complete it again to restore your progress.',
      link: '/tasks',
    });
  }
});

// ─── Events ─────────────────────────────────────────────────────────────────

exports.onParticipantJoined = onDocumentCreated(
  { document: 'event_participants/{id}', region: REGION },
  async (event) => {
    const p = event.data?.data();
    if (!p?.event_id) return;
    const eventDoc = await db().doc(`events/${p.event_id}`).get();
    if (!eventDoc.exists) return;
    const e = eventDoc.data();
    const link = `/events`;

    await notify(p.uid, {
      type: 'task_completed',
      title: `You're in. ${e.title || 'event'}`,
      body: 'We’ll let you know when the draw is out.',
      link,
    });
    await notifyJoinDigest(e, p);
  },
);

// ─── Scheduled reminders ────────────────────────────────────────────────────

// Tuesday 9am: outstanding matches, itemized by opponent and date. Ladder-reset was retired.
exports.weeklyReminders = onSchedule({ schedule: '0 9 * * 2', timeZone: TZ, region: REGION }, async () => {
  const weekKey = reminderWeekKey();
  const matches = await db()
    .collection('matches')
    .where('category', 'in', ['singles', 'doubles'])
    .where('status', '==', 'pending')
    .get();
  const pending = matches.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => isRealMatch(m.id, m) && matchPlayers(m).length >= 2);

  const [eventById, userById] = await Promise.all([
    getAllByIds('events', eventReadIds(pending)),
    getAllByIds('users', opponentReadIds(pending)),
  ]);
  const namesByUid = new Map([...userById].map(([id, data]) => [id, data.name || '']));
  const pendingCountByUser = new Map();
  pending.forEach((m) => {
    matchPlayers(m).forEach((uid) => pendingCountByUser.set(uid, (pendingCountByUser.get(uid) || 0) + 1));
  });
  await Promise.all(
    pendingMatchNotices({ matches: pending, eventById, namesByUid, weekKey }).map((n) =>
      notifyOnce(n.key, n.uid, n.payload),
    ),
  );

  // Accepted rallies/challenges — "still needs to be played." A rally already converted to a
  // Challenge (source: 'rally') is excluded, since it's no longer an unresolved rally.
  const [acceptedRallies, acceptedChallenges, rallyChallenges] = await Promise.all([
    db().collection('matches').where('category', '==', 'rally').where('status', '==', 'accepted').get(),
    db().collection('matches').where('category', '==', 'challenge').where('status', '==', 'accepted').get(),
    db().collection('matches').where('category', '==', 'challenge').where('source', '==', 'rally').get(),
  ]);
  const resolvedRallyPairs = new Set(
    rallyChallenges.docs.map((d) => [d.data().player_1_uid, d.data().player_2_uid].sort().join('|')),
  );
  const rallyCountByUser = new Map();
  acceptedRallies.docs.forEach((d) => {
    const r = d.data();
    if (!r.player_1_uid || !r.player_2_uid) return;
    if (resolvedRallyPairs.has([r.player_1_uid, r.player_2_uid].sort().join('|'))) return;
    [r.player_1_uid, r.player_2_uid].forEach((uid) => rallyCountByUser.set(uid, (rallyCountByUser.get(uid) || 0) + 1));
  });
  const challengeCountByUser = new Map();
  acceptedChallenges.docs.forEach((d) => {
    const c = d.data();
    if (!c.player_1_uid || !c.player_2_uid) return;
    [c.player_1_uid, c.player_2_uid].forEach((uid) =>
      challengeCountByUser.set(uid, (challengeCountByUser.get(uid) || 0) + 1),
    );
  });

  await Promise.all(
    incompleteMatchNotices({ pendingCountByUser, rallyCountByUser, challengeCountByUser, weekKey }).map((n) =>
      notifyOnce(n.key, n.uid, n.payload),
    ),
  );
});

// Nightly cleanup: drop notifications older than 30 days.
exports.pruneNotifications = onSchedule({ schedule: '0 3 * * *', timeZone: TZ, region: REGION }, async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Loops until the backlog is clear instead of deleting a single batch of 500 per night.
  // weeklyReminders alone can create more than 500 in one run, so the old single-shot version
  // could never catch up once creation outpaced it — the collection grew without bound and the
  // 30-day retention was silently violated. The page cap stops a runaway from burning the
  // whole function timeout.
  const PAGE = 400;
  const MAX_PAGES = 25;
  let deleted = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const old = await db().collection('notifications').where('created_at', '<', cutoff).limit(PAGE).get();
    if (old.empty) break;
    const batch = db().batch();
    old.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += old.size;
    if (old.size < PAGE) break;
  }
  if (deleted === 0) return;
  logger.info(`Pruned ${deleted} notifications`);
});
