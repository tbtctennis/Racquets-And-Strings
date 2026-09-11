import { isTournamentType } from '../../utils/eventTypes';

/**
 * Joined tournament status opens that event's draw. The tournament page then
 * lands on the member's own draw (division, skill, zone) and keeps live-draw
 * visibility behind participation. Socials, ladders, and Specials have no draw.
 */
export function joinedDrawHref(event?: { id?: string; type?: string } | null): string | undefined {
  const id = event?.id?.trim() ?? '';
  if (!id || !isTournamentType(event?.type ?? '')) return undefined;
  return `/matches?mode=tournament&event=${id}`;
}
