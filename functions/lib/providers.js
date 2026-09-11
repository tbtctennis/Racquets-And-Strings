const admin = require('firebase-admin');

/**
 * Provider identity is server-owned. A providers row is the only grant; leftover preference
 * flags are not consulted.
 */
function hasProviderRoles(data) {
  return Array.isArray(data?.roles) && data.roles.length > 0;
}

async function providerForUid(uid) {
  const snap = await admin.firestore().collection('providers').where('member_uid', '==', uid).limit(10).get();
  return snap.docs.find((doc) => hasProviderRoles(doc.data())) || null;
}

async function providerIdForUid(uid) {
  const doc = await providerForUid(uid);
  return doc ? doc.id : null;
}

async function providerIdForRole(uid, role) {
  const doc = await providerForUid(uid);
  if (!doc) return null;
  const data = doc.data();
  return data.roles.includes(role) ? doc.id : null;
}

module.exports = { hasProviderRoles, providerForUid, providerIdForUid, providerIdForRole };
