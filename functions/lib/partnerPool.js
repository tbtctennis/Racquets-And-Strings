/** Pure partner-pool data helpers shared by the Firestore triggers and tests. */

const copyIfPresent = (target, source, key) => {
  const value = source?.[key];
  if (typeof value === 'string' && value.trim()) target[key] = value.trim();
  else if (Array.isArray(value) && value.length) target[key] = value;
};

/**
 * Build the narrow contact projection exposed to members of the same pool.
 * Empty channels are deliberately omitted so the pool never publishes blanks or unrelated
 * account metadata. `whatsapp_same_as_phone` is retained only when it grants a real channel.
 */
function contactProjection(contact = {}) {
  const projection = {};
  copyIfPresent(projection, contact, 'email');
  copyIfPresent(projection, contact, 'phone');
  copyIfPresent(projection, contact, 'whatsapp_contact');
  copyIfPresent(projection, contact, 'preferred_mode_of_contact');
  if (contact.whatsapp_same_as_phone === true && projection.phone) projection.whatsapp_same_as_phone = true;
  if (contact.contactable === true) projection.contactable = true;
  return projection;
}

function poolNotification(eventId, eventTitle, member) {
  const category = member.category || 'doubles';
  return {
    type: 'partner_pool_joined',
    title: 'A new player is waiting to partner up!',
    body: `${member.name || 'A player'} joined the ${category} doubles pool for ${eventTitle || 'your event'}.`,
    link: `/tournament?event=${eventId}`,
  };
}

module.exports = { contactProjection, poolNotification };
