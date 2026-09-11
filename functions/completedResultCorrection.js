const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { REGION, SUPER_ADMIN_UID } = require('./lib/constants');
const { handleCorrectCompletedResult } = require('./lib/completedResultCorrection');

const db = () => admin.firestore();

/** Organizer or super-admin replaces a completed tournament result and writes the correction audit. */
exports.correctCompletedResult = onCall({ region: REGION }, async (request) =>
  handleCorrectCompletedResult(request, {
    db: db(),
    superAdminUid: SUPER_ADMIN_UID,
    nowIso: new Date().toISOString(),
  }),
);
