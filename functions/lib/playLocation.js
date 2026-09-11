/**
 * Server-side location contract for challenges and rallies.
 * An unset member location is allowed because the event they joined supplies the playing scope.
 */
const memberLocation = async (db, uid) => {
  if (!db || !uid) return undefined;
  const snap = await db.doc(`stats/${uid}`).get();
  const value = snap.exists ? snap.data()?.location : undefined;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const assertPlayableLocationPair = async (db, playerOne, playerTwo) => {
  const [first, second] = await Promise.all([memberLocation(db, playerOne), memberLocation(db, playerTwo)]);
  if (first && second && first !== second) {
    const error = new Error('Players must belong to the same location.');
    error.code = 'cross-location';
    throw error;
  }
  return { first, second };
};

module.exports = { assertPlayableLocationPair, memberLocation };
