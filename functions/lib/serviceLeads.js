const admin = require('firebase-admin');
const { linkPlayers } = require('../connections');

const db = () => admin.firestore();

/** Record a service interest once and connect the member to the linked provider account. */
async function recordServiceLead({ uid, providerId, serviceId, source }) {
  const providerSnap = await db().doc(`providers/${providerId}`).get();
  if (!providerSnap.exists) return;
  const provider = providerSnap.data() || {};
  const leadRef = db().doc(`providers/${providerId}/leads/${uid}`);
  await leadRef.set(
    {
      uid,
      provider_id: providerId,
      service_id: serviceId,
      source,
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );
  if (provider.member_uid) await linkPlayers(uid, provider.member_uid, 'service-lead');
}

module.exports = { recordServiceLead };
