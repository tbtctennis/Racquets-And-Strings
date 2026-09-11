const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { REGION, SUPER_ADMIN_UID } = require('./lib/constants');
const { requireAuth } = require('./lib/callable');
const { applyOrganizerAssignment } = require('./lib/organizerAssignment');

const db = () => admin.firestore();

/** Event owner or super-admin replaces `organizer_ids` and writes the assignment audit row. */
exports.assignEventOrganizers = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  return applyOrganizerAssignment({
    db: db(),
    uid,
    superAdminUid: SUPER_ADMIN_UID,
    data: request.data || {},
    nowIso: new Date().toISOString(),
  });
});
