const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { REGION, SUPER_ADMIN_UID } = require('./lib/constants');
const { requireAuth } = require('./lib/callable');
const { applyCourtResolution } = require('./lib/courtResolution');

const db = () => admin.firestore();

/** Super-admin adds or re-zones a court without editing shipped CSV/`courts.json`. */
exports.resolveCourtZone = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  return applyCourtResolution({
    db: db(),
    uid,
    superAdminUid: SUPER_ADMIN_UID,
    data: request.data || {},
    nowIso: new Date().toISOString(),
  });
});
