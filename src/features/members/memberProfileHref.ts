/** Placeholder uids used for Player Loading slots, not real member documents. */
const SENTINEL_UID = /^__/;

/**
 * Draw names link to `/players/:uid` only when a real member uid is present.
 * Empty, whitespace, and sentinel uids stay plain text so BYE / Player Loading
 * never expose a restricted or non-existent profile.
 */
export function memberProfileHref(uid?: string | null): string | undefined {
  const id = uid?.trim() ?? '';
  if (!id || SENTINEL_UID.test(id)) return undefined;
  return `/players/${id}`;
}
