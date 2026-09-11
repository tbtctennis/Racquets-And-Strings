export const PROVIDER_ROLES = Object.freeze(['stringer', 'coach', 'other']);

const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

const rolesOf = (data) =>
  Array.isArray(data?.roles) ? data.roles.filter((role) => PROVIDER_ROLES.includes(role)) : [];

/** Legacy preference flags. Used only to plan providers writes; never for authorization. */
export const inferProviderRoleFromPreferences = (prefs = {}) => {
  const memberUid = trimmed(prefs.uid);
  const claims = [];
  if (prefs.stringer === true) {
    const providerId = trimmed(prefs.stringer_id);
    if (providerId && memberUid) claims.push({ providerId, role: 'stringer', memberUid });
  }
  if (prefs.coach === true) {
    const providerId = trimmed(prefs.coach_id);
    if (providerId && memberUid) claims.push({ providerId, role: 'coach', memberUid });
  }
  return claims;
};

/** Authorization: a providers row linked to the uid is the only grant. */
export const isCanonicalProviderFor = (uid, providerId, providers = []) => {
  if (!uid || !providerId) return false;
  return providers.some((row) => row?.id === providerId && row?.member_uid === uid);
};

const mergeRoles = (current, role) => (current.includes(role) ? current : [...current, role]);

/**
 * Plan additive providers upserts from leftover preference inference.
 * Existing linked rows keep their name. Conflicting member_uid links refuse the whole plan.
 */
export const planProviderRoleMigration = ({ preferences = [], providers = [] } = {}) => {
  const existing = new Map(providers.map((row) => [row.id, { ...(row.data || {}) }]));
  const originalIds = new Set(existing.keys());
  const updates = [];
  const invalid = [];
  let skippedClaims = 0;
  let inferredClaims = 0;
  let prefsWithoutClaims = 0;

  for (const { id, data } of preferences) {
    const claims = inferProviderRoleFromPreferences({ ...(data || {}), uid: data?.uid || id });
    if (!claims.length) {
      prefsWithoutClaims += 1;
      continue;
    }
    for (const claim of claims) {
      inferredClaims += 1;
      const current = existing.get(claim.providerId);
      const currentRoles = rolesOf(current);
      if (current?.member_uid && current.member_uid !== claim.memberUid) {
        invalid.push({
          id: claim.providerId,
          memberUid: claim.memberUid,
          currentMemberUid: current.member_uid,
        });
        continue;
      }
      const nextRoles = mergeRoles(currentRoles, claim.role);
      const alreadyLinked = current?.member_uid === claim.memberUid;
      const alreadyHasRole = currentRoles.includes(claim.role);
      if (alreadyLinked && alreadyHasRole) {
        skippedClaims += 1;
        continue;
      }
      const next = {
        id: claim.providerId,
        name: trimmed(current?.name) || claim.providerId,
        roles: nextRoles,
        member_uid: claim.memberUid,
        ...(trimmed(current?.area) ? { area: trimmed(current.area) } : {}),
      };
      existing.set(claim.providerId, next);
      const prior = updates.find((row) => row.id === claim.providerId);
      const action = originalIds.has(claim.providerId) ? 'merge' : 'create';
      if (prior) {
        prior.roles = nextRoles;
        prior.member_uid = claim.memberUid;
        prior.action = action;
      } else {
        updates.push({
          ...next,
          action,
        });
      }
    }
  }

  return {
    updates,
    invalid,
    inferredClaims,
    skippedClaims,
    skipped: prefsWithoutClaims + skippedClaims,
  };
};

export const migrateProviderRoles = async (db, { dryRun = true, logger = console } = {}) => {
  const [prefSnap, providerSnap] = await Promise.all([
    db.collection('preferences').get(),
    db.collection('providers').get(),
  ]);
  const preferences = prefSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const providers = providerSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  const plan = planProviderRoleMigration({ preferences, providers });
  if (plan.invalid.length) {
    throw new Error(
      `Provider-role migration refused: ${plan.invalid
        .map(
          ({ id, memberUid, currentMemberUid }) =>
            `providers/${id} already linked to ${currentMemberUid}, inferred ${memberUid}`,
        )
        .join('; ')}`,
    );
  }

  plan.updates.forEach(({ id, action, member_uid, roles }) => {
    logger.log(
      `${dryRun ? '[dry-run] ' : ''}providers/${id}: ${action} member_uid=${member_uid} roles=${roles.join(',')}`,
    );
  });

  if (!dryRun) {
    const now = new Date().toISOString();
    for (let index = 0; index < plan.updates.length; index += 400) {
      const batch = db.batch();
      plan.updates.slice(index, index + 400).forEach((row) => {
        batch.set(
          db.doc(`providers/${row.id}`),
          {
            id: row.id,
            name: row.name,
            roles: row.roles,
            member_uid: row.member_uid,
            ...(row.area ? { area: row.area } : {}),
            updated_at: now,
          },
          { merge: true },
        );
      });
      await batch.commit();
    }
  }

  return {
    scanned: preferences.length,
    eligible: plan.updates.length,
    changed: dryRun ? 0 : plan.updates.length,
    skipped: plan.skipped,
    failed: 0,
    planned: dryRun ? plan.updates.length : 0,
    updates: plan.updates,
  };
};
