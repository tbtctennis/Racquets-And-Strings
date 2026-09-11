export type EventParticipantWrite = {
  uid: string;
  user_name: string;
  event_id: string;
  event_name: string;
  tournament_choice: string;
  doubles: string;
  partner_in_app: string;
  skill: number;
  dateselected: string[];
  created_at: string;
  division?: string | undefined;
  skill_group?: string | undefined;
  partner_uid?: string | undefined;
  partner_name?: string | undefined;
  zone?: string | undefined;
  status?: 'active' | 'withdrawn' | undefined;
  withdrawn_reason?: 'injury' | 'unavailable' | 'cannot_contact' | 'other' | undefined;
  withdrawn_note?: string | undefined;
  withdrawn_at?: string | undefined;
  withdrawn_by?: 'self' | string | undefined;
  seed?: number | undefined;
};

/**
 * Keep participant document shape in one place. Optional fields are omitted rather than written
 * as undefined because Firestore treats the two shapes differently during field validation.
 */
export const buildEventParticipantData = (input: EventParticipantWrite) => ({
  uid: input.uid,
  user_name: input.user_name,
  event_id: input.event_id,
  event_name: input.event_name,
  tournament_choice: input.tournament_choice,
  doubles: input.doubles,
  partner_in_app: input.partner_in_app,
  skill: input.skill,
  dateselected: input.dateselected,
  created_at: input.created_at,
  ...(input.division !== undefined ? { division: input.division } : {}),
  ...(input.skill_group !== undefined ? { skill_group: input.skill_group } : {}),
  ...(input.partner_uid !== undefined ? { partner_uid: input.partner_uid } : {}),
  ...(input.partner_name !== undefined ? { partner_name: input.partner_name } : {}),
  ...(input.zone !== undefined ? { zone: input.zone } : {}),
  ...(input.status !== undefined ? { status: input.status } : {}),
  ...(input.withdrawn_reason !== undefined ? { withdrawn_reason: input.withdrawn_reason } : {}),
  ...(input.withdrawn_note !== undefined ? { withdrawn_note: input.withdrawn_note } : {}),
  ...(input.withdrawn_at !== undefined ? { withdrawn_at: input.withdrawn_at } : {}),
  ...(input.withdrawn_by !== undefined ? { withdrawn_by: input.withdrawn_by } : {}),
  ...(typeof input.seed === 'number' && Number.isFinite(input.seed) ? { seed: input.seed } : {}),
});
