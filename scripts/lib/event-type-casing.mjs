export const EVENT_TYPES = Object.freeze(['Socials', 'Tournaments', 'Specials', 'League Ladder']);

const LEGACY_EVENT_TYPES = new Map([
  ['Social', 'Socials'],
  ['Meetup', 'Socials'],
  ['Tournament', 'Tournaments'],
  ['tournament', 'Tournaments'],
  ['League Event', 'Tournaments'],
  ['Special Event', 'Specials'],
]);

export const normalizeEventType = (value) => {
  if (EVENT_TYPES.includes(value)) return value;
  return LEGACY_EVENT_TYPES.get(value) || null;
};

/** Plan only known, non-canonical event types; unknown values are never silently changed. */
export const planEventTypeUpdates = (events) =>
  events.reduce(
    (plan, { id, data }) => {
      const current = data?.type;
      const normalized = normalizeEventType(current);
      if (!normalized) {
        plan.invalid.push({ id, current });
      } else if (normalized === current) {
        plan.skipped += 1;
      } else {
        plan.updates.push({ id, current, normalized });
      }
      return plan;
    },
    { updates: [], invalid: [], skipped: 0 },
  );

/** Normalize events in bounded batches. Invalid values abort before the first write. */
export const migrateEventTypes = async (db, { dryRun = true, limit = null, resume = null, logger = console } = {}) => {
  const snapshot = await db
    .collection('events')
    .orderBy('__name__')
    .startAfter(resume || '')
    .limit(limit || 1000)
    .get();
  const events = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const plan = planEventTypeUpdates(events);
  if (plan.invalid.length) {
    throw new Error(
      `Unknown event type(s); migration refused: ${plan.invalid.map(({ id, current }) => `events/${id}=${current ?? '(missing)'}`).join(', ')}`,
    );
  }

  plan.updates.forEach(({ id, current, normalized }) => {
    logger.log(`${dryRun ? '[dry-run] ' : ''}events/${id}.type: ${current} → ${normalized}`);
  });

  if (!dryRun) {
    for (let index = 0; index < plan.updates.length; index += 400) {
      const batch = db.batch();
      plan.updates.slice(index, index + 400).forEach(({ id, normalized }) => {
        batch.update(db.doc(`events/${id}`), { type: normalized });
      });
      await batch.commit();
    }
  }

  return {
    scanned: events.length,
    eligible: plan.updates.length,
    changed: dryRun ? 0 : plan.updates.length,
    skipped: plan.skipped,
    failed: 0,
    planned: dryRun ? plan.updates.length : 0,
    updates: plan.updates,
    lastId: events.at(-1)?.id || null,
  };
};
