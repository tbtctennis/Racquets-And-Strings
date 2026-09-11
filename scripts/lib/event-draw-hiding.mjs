import admin from 'firebase-admin';

export const planEventDrawHidingStrips = (events) =>
  events
    .filter(({ data }) => Object.hasOwn(data || {}, 'hide_seniors') || Object.hasOwn(data || {}, 'hide_beginners'))
    .map(({ id, data }) => ({
      id,
      fields: ['hide_seniors', 'hide_beginners'].filter((field) => Object.hasOwn(data || {}, field)),
    }));

export const stripEventDrawHiding = async (db, { dryRun = true, logger = console } = {}) => {
  const snap = await db.collection('events').get();
  const events = snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const updates = planEventDrawHidingStrips(events);
  updates.forEach(({ id, fields }) =>
    logger.log(`${dryRun ? '[dry-run] ' : ''}events/${id}: remove ${fields.join(', ')}`),
  );

  if (!dryRun) {
    for (let index = 0; index < updates.length; index += 400) {
      const batch = db.batch();
      updates.slice(index, index + 400).forEach(({ id, fields }) => {
        batch.update(
          db.doc(`events/${id}`),
          Object.fromEntries(fields.map((field) => [field, admin.firestore.FieldValue.delete()])),
        );
      });
      await batch.commit();
    }
  }

  return {
    scanned: events.length,
    eligible: updates.length,
    changed: dryRun ? 0 : updates.length,
    skipped: events.length - updates.length,
    failed: 0,
    planned: dryRun ? updates.length : 0,
    updates,
  };
};
