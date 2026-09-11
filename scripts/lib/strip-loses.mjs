import admin from 'firebase-admin';

/** Return stats documents that still contain the retired `loses` field. */
export const planLosesStrips = (stats) =>
  stats.filter(({ data }) => data?.loses !== undefined).map(({ id, data }) => ({ id, current: data.loses }));

/** Remove `stats/{uid}.loses` after previewing the complete, idempotent diff. */
export const stripLoses = async (db, { dryRun = true, logger = console } = {}) => {
  const snap = await db.collection('stats').get();
  const stats = snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const updates = planLosesStrips(stats);

  updates.forEach(({ id, current }) => {
    logger.log(`${dryRun ? '[dry-run] ' : ''}stats/${id}.loses: ${current} → (removed)`);
  });

  if (!dryRun) {
    for (let i = 0; i < updates.length; i += 400) {
      const batch = db.batch();
      updates.slice(i, i + 400).forEach(({ id }) => {
        batch.update(db.doc(`stats/${id}`), { loses: admin.firestore.FieldValue.delete() });
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
