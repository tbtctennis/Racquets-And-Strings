import type { ContactData, EventParticipant } from '../../types';

/** Placeholder uids used for Player Loading slots, not real member documents. */
const SENTINEL_UID = /^__/;

/**
 * Active roster check used by the organizer overview. Must stay aligned with
 * `isActiveEventParticipant` in `functions/connections.js` — withdrawal deletes the
 * organizer connection, so a withdrawn row must not keep a contact action.
 */
export const isActiveRosterParticipant = (
  participant: Pick<EventParticipant, 'removal' | 'status'> & { active?: boolean } = {},
): boolean =>
  participant.removal !== true &&
  participant.active !== false &&
  !['withdrawn', 'removed', 'inactive'].includes(String(participant.status || '').toLowerCase());

export type OrganizerOverviewPerson = {
  uid: string;
  name: string;
  meta: string;
};

/**
 * Unique active sign-ups the organizer may try to contact. Denied `contacts` reads stay
 * off this list's action — callers pass whatever `useContacts` resolved.
 */
export const selectOrganizerOverviewParticipants = (
  participants: readonly EventParticipant[],
  viewerUid?: string | null | undefined,
): OrganizerOverviewPerson[] => {
  const seen = new Set<string>();
  const people: OrganizerOverviewPerson[] = [];
  for (const participant of participants) {
    const uid = participant.uid?.trim() ?? '';
    if (!uid || SENTINEL_UID.test(uid) || seen.has(uid)) continue;
    if (viewerUid && uid === viewerUid) continue;
    if (!isActiveRosterParticipant(participant)) continue;
    seen.add(uid);
    people.push({
      uid,
      name: participant.user_name || '',
      meta: [participant.tournament_choice, participant.division, participant.skill ? `skill ${participant.skill}` : '']
        .filter(Boolean)
        .join(' · '),
    });
  }
  return people.sort((a, b) => a.name.localeCompare(b.name) || a.uid.localeCompare(b.uid));
};

/** Contact fields for `ContactOpponentButton`, or null when the connection read did not resolve. */
export const organizerOverviewContact = (
  contact: ContactData | undefined,
): Pick<ContactData, 'phone' | 'email' | 'whatsapp_contact' | 'preferred_mode_of_contact'> | null => {
  if (!contact) return null;
  return {
    phone: contact.phone,
    email: contact.email,
    whatsapp_contact: contact.whatsapp_contact,
    preferred_mode_of_contact: contact.preferred_mode_of_contact,
  };
};
