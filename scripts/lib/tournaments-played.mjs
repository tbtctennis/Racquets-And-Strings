const isTournament = (event) => event?.type === 'Tournaments';

/** Return one tournament-event count per member, collapsing duplicate participant rows. */
export const tournamentParticipationCounts = (participants, events) => {
  const tournamentEventIds = new Set(events.filter((event) => isTournament(event.data)).map((event) => event.id));
  const eventsByUid = new Map();

  participants.forEach((participant) => {
    if (!participant.uid || !participant.event_id || !tournamentEventIds.has(participant.event_id)) return;
    const eventIds = eventsByUid.get(participant.uid) || new Set();
    eventIds.add(participant.event_id);
    eventsByUid.set(participant.uid, eventIds);
  });

  return new Map([...eventsByUid].map(([uid, eventIds]) => [uid, eventIds.size]));
};

/** Plan exact stats values so the migration is safe to preview and idempotent to apply. */
export const planTournamentPlayedUpdates = (stats, participants, events) => {
  const counts = tournamentParticipationCounts(participants, events);
  return stats.map(({ id, data }) => ({
    id,
    current: data.tournamentsPlayed,
    expected: counts.get(id) || 0,
  }));
};

/** Recount and, when requested, set stats/{uid}.tournamentsPlayed to the exact derived value. */
export const backfillTournamentsPlayed = async (db, { dryRun = true, logger = console } = {}) => {
  const [statsSnap, participantsSnap, eventsSnap] = await Promise.all([
    db.collection('stats').get(),
    db.collection('event_participants').get(),
    db.collection('events').get(),
  ]);
  const stats = statsSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const participants = participantsSnap.docs.map((doc) => doc.data());
  const events = eventsSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const updates = planTournamentPlayedUpdates(stats, participants, events).filter(
    ({ current, expected }) => current !== expected,
  );

  updates.forEach(({ id, current, expected }) => {
    logger.log(`${dryRun ? '[dry-run] ' : ''}stats/${id}.tournamentsPlayed: ${current ?? '(missing)'} → ${expected}`);
  });

  if (!dryRun) {
    for (let i = 0; i < updates.length; i += 400) {
      const batch = db.batch();
      updates.slice(i, i + 400).forEach(({ id, expected }) => {
        batch.set(db.doc(`stats/${id}`), { tournamentsPlayed: expected }, { merge: true });
      });
      await batch.commit();
    }
  }

  return {
    scanned: stats.length,
    eligible: updates.length,
    changed: dryRun ? 0 : updates.length,
    skipped: stats.length - updates.length,
    failed: 0,
    planned: dryRun ? updates.length : 0,
    updates,
  };
};
