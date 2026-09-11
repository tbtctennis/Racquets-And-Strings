/**
 * Cancelling an accepted rally or challenge. The browser cannot delete an accepted
 * match (Rules keep that to still-open sender retracts), so this callable deletes
 * and notifies the other player.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { REGION } = require('./lib/constants');
const { requireAuth, requireTrimmedString } = require('./lib/callable');
const { notify } = require('./lib/notify');
const { acceptedCancellationNotice } = require('./lib/matchCancel');

const db = () => admin.firestore();

exports.cancelMatch = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  const matchId = requireTrimmedString(request.data?.matchId, 'Match is required.', { maxLength: 500 });
  const ref = db().collection('matches').doc(matchId);
  const notice = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Match not found.');
    const next = acceptedCancellationNotice(snap.data(), uid);
    if (!next) {
      throw new HttpsError('failed-precondition', 'Only an accepted rally or challenge can be cancelled this way.');
    }
    tx.delete(ref);
    return next;
  });
  await notify(notice.uid, {
    type: notice.type,
    title: notice.title,
    link: notice.link,
  }).catch(() => {});
  return { ok: true };
});
