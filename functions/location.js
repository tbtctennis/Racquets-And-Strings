const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { REGION } = require('./lib/constants');
const { locationFromPreferredCourts } = require('./lib/memberLocation');
const { runtimeResolutionMap } = require('./lib/courtResolution');

const db = () => admin.firestore();

/** Keep the derived competition community beside stats without allowing a blanket default. */
exports.onPreferredCourtsChanged = onDocumentWritten(
  { document: 'preferences/{uid}', region: REGION },
  async (event) => {
    const after = event.data?.after?.data() || {};
    const before = event.data?.before?.data() || {};
    const beforeCourts = Array.isArray(before.preferred_courts) ? before.preferred_courts : [];
    const afterCourts = Array.isArray(after.preferred_courts) ? after.preferred_courts : [];
    if (JSON.stringify(beforeCourts) === JSON.stringify(afterCourts)) return;

    const location = locationFromPreferredCourts(afterCourts, await runtimeResolutionMap(db(), afterCourts));
    await db()
      .doc(`stats/${event.params.uid}`)
      .set(location ? { location } : { location: admin.firestore.FieldValue.delete() }, { merge: true });
  },
);
