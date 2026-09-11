const courts = require('../courts.json');

const TORONTO = 'Toronto';

const courtKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** True when a preferred-court string maps to a shipped site or a runtime overlay. */
const isKnownCourt = (value, shippedRoster = courts, runtimeResolutions = {}) => {
  const key = courtKey(value);
  if (!key) return false;
  if (shippedRoster[key] || runtimeResolutions[key]) return true;
  // Colliding CSV dropdowns are stored as `${dropdownKey}-${nameKey}`; the bare dropdown key is absent.
  return Object.keys(shippedRoster).some((rosterKey) => rosterKey.startsWith(`${key}-`));
};

/** Return the city earned by preferred courts; unknown or empty courts earn no location. */
const locationFromPreferredCourts = (preferredCourts, runtimeResolutions = {}) => {
  if (!Array.isArray(preferredCourts)) return undefined;
  return preferredCourts.some((court) => isKnownCourt(court, courts, runtimeResolutions)) ? TORONTO : undefined;
};

/** Read the server-derived member location without treating a missing field as a city. */
const memberLocation = async (db, uid) => {
  if (!db || !uid) return undefined;
  const snapshot = await db.doc(`stats/${uid}`).get();
  const location = snapshot.exists ? snapshot.data()?.location : undefined;
  return typeof location === 'string' && location.trim() ? location.trim() : undefined;
};

module.exports = { TORONTO, courtKey, locationFromPreferredCourts, memberLocation };
