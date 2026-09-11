/**
 * Server-side partner-pool projections and notifications.
 *
 * Membership is written at partner_pool/{eventId}/members/{uid}. The client may create/delete
 * only its own membership under Firestore Rules; all private contact projections and notifications
 * are written here with the Admin SDK.
 */
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { notify } = require('./lib/notify');
const { REGION } = require('./lib/constants');
const { contactProjection, poolNotification } = require('./lib/partnerPool');

const db = () => admin.firestore();

exports.onPartnerPoolJoin = onDocumentCreated(
  { document: 'partner_pool/{eventId}/members/{uid}', region: REGION },
  async (event) => {
    const member = event.data?.data();
    const { eventId, uid } = event.params;
    if (!member || !uid || member.uid !== uid) return;

    const contactRef = db().doc(`contacts/${uid}`);
    const eventRef = db().doc(`events/${eventId}`);
    const membersRef = db().collection(`partner_pool/${eventId}/members`);
    const [contactSnap, eventSnap, membersSnap] = await Promise.all([
      contactRef.get(),
      eventRef.get(),
      membersRef.where('category', '==', member.category).get(),
    ]);

    // Replaying a create trigger is safe: the projection is deterministic and notifications are
    // best-effort feed entries, while the membership document itself remains one-per-uid.
    await db()
      .doc(`partner_pool/${eventId}/contacts/${uid}`)
      .set(contactProjection(contactSnap.data() || {}));

    const eventData = eventSnap.exists ? eventSnap.data() || {} : {};
    const recipients = membersSnap.docs.map((doc) => doc.id).filter((memberUid) => memberUid !== uid);
    await notify(recipients, poolNotification(eventId, eventData.title || eventData.name, member));
  },
);

exports.onPartnerPoolLeave = onDocumentDeleted(
  { document: 'partner_pool/{eventId}/members/{uid}', region: REGION },
  async (event) => {
    const { eventId, uid } = event.params;
    await db()
      .doc(`partner_pool/${eventId}/contacts/${uid}`)
      .delete()
      .catch(() => {
        // The projection may not exist when a member leaves without contact details.
      });
  },
);

module.exports = exports;
