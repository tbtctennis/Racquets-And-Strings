import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion } from '../../components/Accordion';
import { TournamentMatch, TournamentPlayer } from './types';
import type { ContactMethod } from '../../types';
import { getScheduleState, skillBand } from './utils';
import { formatPersonName } from '../../utils/nameFormatting';
import { ScheduleControls, type ScheduleApi } from './TournamentElements';
import { ContactOpponentButton, pillButtonCls } from '../../components/ContactOpponentButton';
import { sharesCourt } from '../../utils/courtOverlap';
import { NearbyPill } from '../../components/NearbyPill';
import { AvailabilityPills } from '../../components/AvailabilityPills';

// ─── Bracket: your matches + potential next-round opponents ──────────────────────

export type OpponentRow = {
  round: string;
  name: string;
  userId: string;
  email: string;
  phone: string;
  whatsappContact: string;
  preferredContactMethods?: ContactMethod[] | undefined;
  skill: number | null;
  wins: number;
  losses: number;
};

// Shared match-status badge for the bracket (Your Match) and round-robin (Your Group) cards.
// Members see only Pending (not yet played) or Done (a score has been submitted).
const scheduleBadge = (m: TournamentMatch): { text: string; cls: string } =>
  m.status === 'complete'
    ? { text: 'Done', cls: 'bg-green-500/15 text-badge-win border-green-500/25' }
    : { text: 'Pending', cls: 'bg-fg/5 text-fg/70 border-fg/10' };

export const OpponentCard: React.FC<{
  opponent: OpponentRow;
  defaultOpen?: boolean | undefined;
  currentMatch?: TournamentMatch | null | undefined;
  schedule?: ScheduleApi | undefined;
  // A creator who's also playing uses the same Enter/Edit Score flow they have in the Match List
  // (RRGroupCard) — unlike a participant's one-time Submit Score, it stays available after the
  // match is scored (to edit) and isn't limited to an allow-list.
  isCreator?: boolean | undefined;
  // Kept so existing call sites can pass the signed-in user; status is Pending or Done only.
  viewerUid?: string | undefined;
  // For the "Nearby" pill: the viewer's own preferred courts, and uid → preferred courts for
  // everyone in the event (both already loaded by useTournament for RR zone grouping).
  myCourts?: Set<string> | undefined;
  courtsMap?: Record<string, string[]> | undefined;
  availabilityMap?: Record<string, string[]> | undefined;
}> = ({ opponent, defaultOpen = false, currentMatch, schedule, isCreator, myCourts, courtsMap, availabilityMap }) => {
  const [open, setOpen] = useState(defaultOpen);
  const canSchedule = !!currentMatch && !!schedule && !currentMatch.id.startsWith('preview_');
  const isComplete = currentMatch?.status === 'complete';
  const badge = canSchedule ? scheduleBadge(currentMatch!) : null;
  const showAskInline = canSchedule && !isComplete && !getScheduleState(currentMatch!).requested;
  const showSubmitInline =
    canSchedule &&
    !!schedule!.onSubmitScore &&
    (isCreator || (!isComplete && !!schedule!.submittableMatchIds?.has(currentMatch!.id)));
  const submitLabel = isCreator ? 'Score' : 'Submit Score';

  return (
    <Accordion
      id="your-match"
      title="Your Match"
      open={open}
      onToggle={() => setOpen((v) => !v)}
      className="mb-6"
      titleClassName="text-xs uppercase tracking-widest font-bold"
      bodyClassName="space-y-3"
    >
      {opponent.round && <p className="text-xs uppercase tracking-widest text-clay-fg font-bold">{opponent.round}</p>}

      {/* Two-column row: left is name/skill, tier, availability (3 lines); right is
              schedule/score actions, then Contact (2 lines) — matches the Round Robin "Your
              Group" panel and the Upcoming Matches list on the Profile page. The full score is
              still visible in the draw below this card; this row is just the quick-glance
              summary. Read-only (you can't edit another player's profile); phone first,
              email/WhatsApp as fallbacks. */}
      <div className="rounded-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-3.5 py-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {opponent.userId ? (
                <Link
                  to={`/players/${opponent.userId}`}
                  className="text-sm font-semibold text-fg truncate hover:text-clay-fg transition-colors"
                >
                  {opponent.name}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-fg truncate">{opponent.name}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {opponent.skill != null && opponent.skill > 0 && (
                <span className="text-xs text-fg/70">
                  Skill {opponent.skill} · {skillBand(opponent.skill)}
                </span>
              )}
              <NearbyPill show={!!myCourts && sharesCourt(courtsMap?.[opponent.userId], myCourts)} />
            </div>
            <AvailabilityPills tags={availabilityMap?.[opponent.userId]} />
          </div>
          {/* min-w-0 keeps a long opponent name from shoving the badge off a phone. */}
          <div className="min-w-0 flex flex-col items-end gap-1.5 shrink-0">
            <ContactOpponentButton
              name={opponent.name}
              phone={opponent.phone}
              email={opponent.email}
              whatsappContact={opponent.whatsappContact}
              preferred={opponent.preferredContactMethods}
              variant="white"
              size="sm"
            />
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {badge && (
                <span className={`max-w-[9rem] truncate px-2 py-0.5 rounded-xl text-xs font-bold border ${badge.cls}`}>
                  {badge.text}
                </span>
              )}
              {showAskInline && (
                <button
                  type="button"
                  className={pillButtonCls('sm', 'clay')}
                  onClick={() => schedule!.onAskOrganizer(currentMatch!)}
                >
                  Schedule
                </button>
              )}
              {showSubmitInline && (
                <button
                  type="button"
                  className={pillButtonCls('sm', 'clay')}
                  onClick={() => schedule!.onSubmitScore!(currentMatch!)}
                >
                  {submitLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling is locked once the match is complete. Ask-organizer + Submit Score live inline above. */}
      {canSchedule && !isComplete && (
        <ScheduleControls match={currentMatch!} api={schedule!} hideBadge hideAskButton hideSubmitButton />
      )}
    </Accordion>
  );
};

// ─── Round Robin: your group ─────────────────────────────────────────────────────

export const RROpponentPanel: React.FC<{
  group: TournamentPlayer[];
  userId: string;
  isDoubles: boolean;
  defaultOpen?: boolean | undefined;
  pairingMatches?: TournamentMatch[] | undefined;
  schedule?: ScheduleApi | undefined;
  // A creator who's also playing uses the same Enter/Edit Score flow as the Match List (RRGroupCard).
  isCreator?: boolean | undefined;
  // uid → contact details, so we can show the phone number (email only when no phone).
  contactMap?:
    | Record<
        string,
        {
          phone?: string | undefined;
          email?: string | undefined;
          whatsapp_contact?: string | undefined;
          whatsapp_same_as_phone?: boolean | undefined;
          preferred_mode_of_contact?: ContactMethod[] | undefined;
        }
      >
    | undefined;
  // For the "Nearby" pill: the viewer's own preferred courts, and uid → preferred courts.
  myCourts?: Set<string> | undefined;
  courtsMap?: Record<string, string[]> | undefined;
  availabilityMap?: Record<string, string[]> | undefined;
}> = ({
  group,
  userId,
  isDoubles,
  defaultOpen = false,
  pairingMatches,
  schedule,
  isCreator,
  contactMap,
  myCourts,
  courtsMap,
  availabilityMap,
}) => {
  const others = group.filter((p) => p.uid !== userId);
  const [open, setOpen] = useState(defaultOpen);
  if (others.length === 0) return null;

  return (
    <Accordion
      id="your-group"
      title="Your Group"
      open={open}
      onToggle={() => setOpen((v) => !v)}
      className="mb-6"
      titleClassName="text-xs uppercase tracking-widest font-bold"
      bodyClassName="space-y-3"
    >
      {others.map((p) => {
        const c = contactMap?.[p.uid];
        const m = pairingMatches?.find((mm) => mm.player_1_uid === p.uid || mm.player_2_uid === p.uid);
        const canSchedule = !!schedule && !!m && !m.id.startsWith('preview_');
        const isComplete = m?.status === 'complete';
        const badge = canSchedule ? scheduleBadge(m!) : null;
        const showAskInline = canSchedule && !isComplete && !getScheduleState(m!).requested;
        const showSubmitInline =
          canSchedule &&
          !!schedule!.onSubmitScore &&
          (isCreator || (!isComplete && !!schedule!.submittableMatchIds?.has(m!.id)));
        const submitLabel = isCreator ? 'Score' : 'Submit Score';

        return (
          <div key={p.uid} className="rounded-2xl overflow-hidden">
            {/* Two-column row: left is name/skill, tier, availability (3 lines); right is
                  schedule/score actions, then Contact (2 lines) — matches OpponentCard and the
                  Upcoming Matches list on the Profile page. */}
            <div className="flex items-start justify-between gap-3 px-3.5 py-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.uid ? (
                    <Link
                      to={`/players/${p.uid}`}
                      className="text-sm font-semibold text-fg truncate hover:text-clay-fg transition-colors"
                    >
                      {formatPersonName(p.name)}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-fg truncate">{formatPersonName(p.name)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!!p.skillLevel && (
                    <span className="text-xs text-fg/70">
                      Skill {p.skillLevel} · {skillBand(p.skillLevel)}
                    </span>
                  )}
                  <NearbyPill show={!!myCourts && sharesCourt(courtsMap?.[p.uid], myCourts)} />
                </div>
                <AvailabilityPills tags={availabilityMap?.[p.uid]} />
              </div>
              {/* min-w-0 keeps a long opponent name from shoving the badge off a phone. */}
              <div className="min-w-0 flex flex-col items-end gap-1.5 shrink-0">
                <ContactOpponentButton
                  name={formatPersonName(p.name)}
                  phone={c?.phone}
                  email={c?.email}
                  whatsappContact={c?.whatsapp_contact}
                  preferred={c?.preferred_mode_of_contact}
                  variant="white"
                  size="sm"
                />
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {badge && (
                    <span
                      className={`max-w-[9rem] truncate px-2 py-0.5 rounded-xl text-xs font-bold border ${badge.cls}`}
                    >
                      {badge.text}
                    </span>
                  )}
                  {showAskInline && (
                    <button
                      type="button"
                      className={pillButtonCls('sm', 'clay')}
                      onClick={() => schedule!.onAskOrganizer(m!)}
                    >
                      Schedule
                    </button>
                  )}
                  {showSubmitInline && (
                    <button
                      type="button"
                      className={pillButtonCls('sm', 'clay')}
                      onClick={() => schedule!.onSubmitScore!(m!)}
                    >
                      {submitLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Matchday note — shown once for the whole group */}
      <p className="text-xs text-fg/70 leading-snug px-1">
        Matchdays. Schedule prepared by organizer based on your availability.
      </p>
    </Accordion>
  );
};
