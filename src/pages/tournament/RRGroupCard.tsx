import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RRStandingRow, TournamentMatch, TournamentPlayer } from './types';
import { PLAYER_LOADING, formatSetScores } from './utils';
import { formatPersonName } from '../../utils/nameFormatting';
import { PersonPairRow } from '../../components/PersonPairRow';
import { PersonRow, seedForUid } from '../../components/PersonRow';
import { memberProfileHref } from '../../features/members/memberProfileHref';
import { PLAYER_LOADING_SENTINEL } from './AddPlayerPanel';
import { ContactOpponentButton, pillButtonCls } from '../../components/ContactOpponentButton';
import { pgWinPct } from '../../features/leagues/useStandings';
import type { ContactData } from '../../types';
import { useConfirmSheet } from '../../components/useConfirmSheet';
import { PersonOption } from '../../components/PersonOption';
import { ProgressRing } from '../../components/ProgressRing';
import { Popover, popoverRowClassName } from '../../components/Popover';
import { SelectSheet } from '../../components/SelectSheet';
import { field, fieldLabelCls } from '../../components/Input';
import { cn } from '../../lib/cn';
import { Switch } from '../../components/Switch';
import { realRoundRobinMatches } from '../../features/tournament/domain/roundRobin';

type Props = {
  groupIndex: number;
  groupLabel: string;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  standings: RRStandingRow[];
  advancementCount: number;
  isCreator: boolean;
  isParticipant: boolean;
  // The viewer's own uid — a non-creator only sees their own match(es) in the list below.
  currentUserId?: string;
  isPastEvent: boolean;
  editMode: boolean;
  editPlayers: TournamentPlayer[];
  allGroupPlayers: TournamentPlayer[];
  onEditPlayer: (matchId: string, slot: 'player_1' | 'player_2', player: TournamentPlayer | null) => void;
  onSubmitScore?: (match: TournamentMatch) => void;
  submittableMatchIds?: Set<string>;
  pendingMatchIds?: Set<string>;
  onSaveGroupEdit: (groupIndex: number, newPlayers: TournamentPlayer[]) => void;
  onRenameGroup?: (label: string) => void;
  /**
   * uid → career standings row. Overall P/G won % is the lifetime figure; Wins is this group's
   * matchWins. Supplied by RoundRobinView; a missing P/G entry renders as an em-dash.
   */
  statsByUid?: Map<string, { pointswon?: number; totalPointsPlayed?: number }>;
  /** uid -> contact details, resolved once by RoundRobinView. Absent = no Contact button. */
  contactsByUid?: Record<string, ContactData>;
  /** Organizer removes a player from the draw (soft delete — see handleRemovePlayer). */
  onRemovePlayer?: (uid: string) => void;
  /** Organizer moves a player to another zone's draw. Addressed by uid, not participant id. */
  onMovePlayerZone?: (uid: string, bucketId: string) => void;
  /** Zone buckets offered in that picker. Empty hides the control entirely. */
  zoneBuckets?: { id: string; label: string }[];
  /** Participant asks the organizer to schedule an unplayed match. */
  onAskSchedule?: (match: TournamentMatch) => void;
  /** Organizer pays/takes back this group's bonus. Players see the switch but can't move it. */
  onSetGroupBonus?: (award: boolean) => Promise<void>;
};

const PlayerPicker: React.FC<{
  label: string;
  value: TournamentPlayer | null;
  options: TournamentPlayer[];
  onChange: (player: TournamentPlayer) => void;
  includeLoading?: boolean;
}> = ({ label, value, options, onChange, includeLoading = false }) => {
  const [open, setOpen] = useState(false);
  const isLoading = value?.uid === PLAYER_LOADING_SENTINEL;
  const choose = (player: TournamentPlayer) => {
    onChange(player);
    setOpen(false);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className="min-w-0 w-full truncate rounded-xl bg-tennis-surface px-2 py-1 text-left text-xs text-fg outline-none focus-visible:ring-2 focus-visible:ring-clay"
      >
        {isLoading ? PLAYER_LOADING : value ? formatPersonName(value.name) : label}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} aria-label={`${label} choices`}>
        {includeLoading && (
          <PersonOption
            name={PLAYER_LOADING}
            selected={isLoading}
            onSelect={() => choose({ uid: PLAYER_LOADING_SENTINEL, name: PLAYER_LOADING, participantId: '' })}
            className={popoverRowClassName}
          />
        )}
        {options.map((player) => (
          <PersonOption
            key={player.uid}
            name={player.name}
            selected={player.uid === value?.uid}
            onSelect={() => choose(player)}
            className={popoverRowClassName}
          />
        ))}
      </Popover>
    </div>
  );
};

export const RRGroupCard: React.FC<Props> = ({
  groupIndex,
  groupLabel,
  players,
  matches,
  standings,
  advancementCount,
  isCreator,
  isParticipant,
  currentUserId,
  isPastEvent,
  editMode,
  editPlayers,
  allGroupPlayers,
  onEditPlayer,
  onSubmitScore,
  submittableMatchIds,
  pendingMatchIds,
  onSaveGroupEdit,
  onRenameGroup,
  statsByUid,
  contactsByUid,
  onRemovePlayer,
  onMovePlayerZone,
  zoneBuckets = [],
  onAskSchedule,
  onSetGroupBonus,
}) => {
  const { ask: askConfirmation, sheet: confirmationSheet } = useConfirmSheet();
  // Which standings row is expanded to show the full stat line (wireframe 1c: Group Pts is the
  // one primary number; Wins / P/G Won % / Pending / Contact are a tap away).
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // Creator-only pairings list at the foot of the card.
  const [matchesOpen, setMatchesOpen] = useState(false);
  // Local edit state: copy of players in this group for reassignment
  const [localPlayers, setLocalPlayers] = useState<TournamentPlayer[]>(players);
  // Local draft of the group name (creator rename).
  const [labelDraft, setLabelDraft] = useState(groupLabel);
  // Group bonus in flight — the switch is frozen until the batch lands.
  const [awarding, setAwarding] = useState(false);

  // The paid stamp lives on the match docs, so every viewer reads the same state off the live feed.
  const bonusAwarded = matches.some((m) => !!m.rr_groupbonus);
  // Completion ring uses real pairings only. A one-player placeholder can never be played, so it
  // must not read as 100% beside the knockout gate (D6-C1-T1 / TASK-502).
  const realMatches = realRoundRobinMatches(matches);
  const completedRealMatches = realMatches.filter((m) => m.status === 'complete').length;
  const groupProgress = realMatches.length === 0 ? 0 : (completedRealMatches / realMatches.length) * 100;

  // Sync local state when the roster actually changes (e.g. after a save completes) — NOT on
  // every new `players` array reference. `players` is derived from the live matches feed, so an
  // unrelated Firestore write anywhere else in the event (another group's score, etc.) produces
  // a new reference on every render; resyncing on reference alone silently discarded an
  // in-progress "Reassign Players" edit before the creator could click Save.
  const playersKey = players
    .map((p) => p.uid)
    .sort()
    .join(',');
  const lastPlayersKeyRef = React.useRef(playersKey);
  React.useEffect(() => {
    if (playersKey !== lastPlayersKeyRef.current) {
      lastPlayersKeyRef.current = playersKey;
      setLocalPlayers(players);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playersKey]);
  React.useEffect(() => {
    setLabelDraft(groupLabel);
  }, [groupLabel]);

  return (
    <div className="rounded-2xl bg-tennis-surface/30 overflow-hidden">
      {/* Group header. Shared Switch — same control as profile Email Notifications. Shown to
          everyone so players can see whether their group has been paid; only the organizer can
          move it, and it's hidden in preview (no match docs yet) — nothing to pay or stamp. */}
      <div className="px-4 py-3 border-b border-fg/10 bg-fg/[0.03] flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-fg min-w-0 truncate">{groupLabel}</h3>
        {(realMatches.length > 0 || (!!onSetGroupBonus && matches.length > 0)) && (
          <div className="shrink-0 flex items-center gap-2">
            {realMatches.length > 0 && <ProgressRing value={groupProgress} label="Group match progress" size={32} />}
            {!!onSetGroupBonus && matches.length > 0 && (
              <>
                <span className="text-xs font-bold uppercase tracking-widest text-fg/70">
                  {bonusAwarded ? 'Bonus Awarded' : 'Group Bonus'}
                </span>
                <Switch
                  checked={bonusAwarded}
                  disabled={!isCreator || awarding}
                  label={bonusAwarded ? 'Bonus Awarded' : 'Group Bonus'}
                  onChange={async (award) => {
                    setAwarding(true);
                    try {
                      await onSetGroupBonus(award);
                    } finally {
                      setAwarding(false);
                    }
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Standings — ranked rows, Group Pts as the one primary number; tap a row for the full line */}
      <div>
        {standings.length > 0 ? (
          <>
            {/* Removed players leave a Player Loading placeholder behind. In a group that's just
                an empty row nobody can act on, so it's hidden here (a knockout keeps its empty
                slot visible, because that's where a replacement gets dropped). */}
            {standings
              .filter((row) => row.userId && row.name !== PLAYER_LOADING)
              .map((row, i) => {
                const isAdvancing = i < advancementCount;
                const expanded = expandedRow === row.userId;
                const canMoveZone = isCreator && editMode && !!onMovePlayerZone && zoneBuckets.length > 0;
                const canWithdraw = isCreator && editMode && !!onRemovePlayer;
                const seed = seedForUid(row.userId, players);
                return (
                  <div key={row.userId} className="border-b border-fg/[0.04] last:border-0">
                    <div className="flex min-w-0 items-center overflow-hidden hover:bg-fg/[0.03] transition-colors">
                      {seed === undefined && (
                        <span className="ml-4 w-4 shrink-0 text-xs font-bold text-fg/70">{row.rank}</span>
                      )}
                      <PersonRow
                        name={row.name}
                        nameHref={memberProfileHref(row.userId)}
                        seed={seed}
                        density="compact"
                        className={`min-w-0 flex-1 border-b-0 pr-2${seed === undefined ? '' : ' pl-4'}`}
                        onClick={() => setExpandedRow((cur) => (cur === row.userId ? null : row.userId))}
                        aria-expanded={expanded}
                        zone={
                          isAdvancing ? (
                            <span className="rounded-xl border border-clay/50 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-clay-fg">
                              ADV
                            </span>
                          ) : undefined
                        }
                        editControls={
                          canMoveZone || canWithdraw ? (
                            <>
                              {/* Move this player to another zone. Same organizer action the zone-change
                              queue offers, but reachable for ANYONE in the draw rather than only players
                              who filed a request. Refused server-side if they've already played — their
                              result belongs to this zone's draw. */}
                              {canMoveZone && (
                                <SelectSheet
                                  label={`Move ${formatPersonName(row.name)} to another zone`}
                                  value=""
                                  placeholder="Zone…"
                                  options={zoneBuckets.map((b) => ({ value: b.id, label: b.label }))}
                                  onChange={(bucketId) => {
                                    if (bucketId) onMovePlayerZone?.(row.userId, bucketId);
                                  }}
                                  hideLabel
                                  className="cursor-pointer rounded-xl border-0 bg-tennis-surface px-2 py-1 text-xs min-h-0"
                                  wrapperClassName="min-w-0"
                                />
                              )}
                              {canWithdraw && (
                                <button
                                  type="button"
                                  aria-label={`Withdraw ${formatPersonName(row.name)}`}
                                  title="Withdraw player"
                                  onClick={() =>
                                    askConfirmation({
                                      title: 'Withdraw this player?',
                                      message: `Withdraw ${formatPersonName(row.name)}? Matches you have not played become walkovers. Played matches stay as they are.`,
                                      confirmLabel: 'Withdraw player',
                                      onConfirm: () => onRemovePlayer?.(row.userId),
                                    })
                                  }
                                  className="rounded-xl p-1.5 text-fg/70 opacity-70 transition-colors hover:bg-red-500/10 hover:text-badge-loss hover:opacity-100"
                                >
                                  <span className="text-badge text-sm font-black leading-none">!</span>
                                </button>
                              )}
                            </>
                          ) : undefined
                        }
                        action={
                          <span className="text-sm font-black tabular-nums text-clay-fg">{row.points} Group Pts</span>
                        }
                      />
                    </div>
                    {expanded &&
                      (() => {
                        // Overall P/G won % is career; Wins is this group's matchWins.
                        const st = statsByUid?.get(row.userId);
                        const isSelf = !!currentUserId && row.userId === currentUserId;

                        // The match this tile acts on is YOUR match against this player, whenever one
                        // exists — being the creator as well as a player must not change that. Keying
                        // off `isCreator` first picked an arbitrary match of theirs (against someone
                        // else entirely), so the tile reported the wrong result and the wrong state.
                        const theirMatches = matches.filter(
                          (m) => m.player_1_uid === row.userId || m.player_2_uid === row.userId,
                        );
                        const mine = currentUserId
                          ? theirMatches.find(
                              (m) => m.player_1_uid === currentUserId || m.player_2_uid === currentUserId,
                            )
                          : undefined;
                        // Only YOUR match gets an action. Scoring anyone's match belongs in the Matches
                        // list at the foot of the card, not as a fifth stat on the row.
                        const relevant = isSelf ? undefined : mine;
                        const played = relevant?.status === 'complete';
                        const theirPending = theirMatches.filter((m) => m.status !== 'complete').length;
                        // Always read from the VIEWER's side, matching every other W/L in the app.
                        // Reading it from the row player's side meant your own defeat showed a green W.
                        const wonIt = played && !!currentUserId && relevant?.winner_uid === currentUserId;

                        const contactTile =
                          isSelf || !contactsByUid?.[row.userId] ? (
                            <span className="text-fg/70">—</span>
                          ) : (
                            <ContactOpponentButton
                              name={row.name}
                              phone={contactsByUid[row.userId]?.phone}
                              email={contactsByUid[row.userId]?.email}
                              whatsappContact={contactsByUid[row.userId]?.whatsapp_contact}
                              preferred={contactsByUid[row.userId]?.preferred_mode_of_contact}
                              size="sm"
                              variant="white"
                            />
                          );

                        // Played → the score, with a W/L pill only when it's YOUR match, since only
                        // then does a win or loss have an owner the viewer can read it as. Actions
                        // sit under the four ruled stats, not as a fifth tile.
                        const actionTile = !relevant ? null : played ? (
                          <span className="inline-flex items-center gap-1.5">
                            {!!mine && (
                              <span
                                className={`px-1.5 py-0.5 rounded-xl text-xs font-black ${wonIt ? 'bg-green-500/15 text-badge-win' : 'bg-red-500/15 text-badge-loss'}`}
                              >
                                {wonIt ? 'W' : 'L'}
                              </span>
                            )}
                            <span className="text-xs font-bold text-fg">
                              {relevant.walkover ? 'Walkover' : formatSetScores(relevant) || 'Recorded'}
                            </span>
                          </span>
                        ) : isCreator ? (
                          <button
                            type="button"
                            onClick={() => onSubmitScore?.(relevant)}
                            className={pillButtonCls('sm', 'clay')}
                          >
                            Score
                          </button>
                        ) : pendingMatchIds?.has(relevant.id) ? (
                          <span className="text-xs font-bold text-badge-win uppercase tracking-wider">Submitted ✓</span>
                        ) : submittableMatchIds?.has(relevant.id) ? (
                          <button
                            type="button"
                            onClick={() => onSubmitScore?.(relevant)}
                            className={pillButtonCls('sm', 'clay')}
                          >
                            Score
                          </button>
                        ) : onAskSchedule ? (
                          <button
                            type="button"
                            onClick={() => onAskSchedule(relevant)}
                            className={pillButtonCls('sm', 'clay')}
                          >
                            Schedule
                          </button>
                        ) : null;

                        return (
                          <div className="space-y-2 px-4 pb-3">
                            <div className="grid grid-cols-4 gap-2 text-center">
                              {[
                                { label: 'Wins', value: row.matchWins },
                                { label: 'P/G Won %', value: st ? pgWinPct(st) : '—' },
                                { label: 'Pending', value: theirPending },
                                { label: 'Contact', value: contactTile },
                              ].map((s) => (
                                // min-w-0 so a 4-column track can actually shrink on a phone (~58px at
                                // 320px) instead of its contents forcing the row wider.
                                <div
                                  key={s.label}
                                  className="min-w-0 rounded-xl bg-fg/[0.04] py-2 flex flex-col items-center justify-center"
                                >
                                  <div className="text-sm font-black text-fg tabular-nums flex-1 flex items-center justify-center">
                                    {s.value}
                                  </div>
                                  <p className="text-xs font-bold uppercase tracking-widest text-fg/70 mt-0.5">
                                    {s.label}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {actionTile ? <div className="flex justify-center">{actionTile}</div> : null}
                          </div>
                        );
                      })()}
                  </div>
                );
              })}
            <p className="px-4 py-1.5 text-center text-xs text-fg/70">Tap a player to contact them</p>
          </>
        ) : (
          players.map((p) => (
            <div key={p.uid} className="border-b border-fg/[0.04] last:border-0">
              <PersonRow
                name={p.name}
                nameHref={memberProfileHref(p.uid)}
                seed={p.seed}
                density="compact"
                className="min-w-0 border-b-0 px-4 text-fg/70"
              />
            </div>
          ))
        )}
      </div>

      {/* Every pairing in the group — CREATOR ONLY. A participant's own match is fully handled in
          their player row above (contact, result, score/schedule), so the list would just repeat
          it; an organizer still needs one place to see and score every pairing at once. */}
      {isCreator && !editMode && matches.length > 0 && (
        <div className="border-t border-fg/10">
          <button
            type="button"
            onClick={() => setMatchesOpen((v) => !v)}
            aria-expanded={matchesOpen}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-fg/[0.03] transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-fg/70">Matches ({matches.length})</span>
            {matchesOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-fg/70" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-fg/70" />
            )}
          </button>

          {matchesOpen && (
            <div>
              {matches
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((m) => {
                  const isDone = m.status === 'complete';
                  const scoreStr = formatSetScores(m);
                  return (
                    <PersonPairRow
                      key={m.id}
                      player1={{
                        uid: m.player_1_uid,
                        name: m.player_1_name,
                        seed: seedForUid(m.player_1_uid, players),
                      }}
                      player2={{
                        uid: m.player_2_uid,
                        name: m.player_2_name,
                        seed: seedForUid(m.player_2_uid, players),
                      }}
                      winnerId={isDone ? m.winner_uid : undefined}
                      meta={
                        isDone && scoreStr ? (
                          <>
                            {scoreStr}
                            {m.walkover && <span className="ml-2 text-xs text-badge/70">Walkover</span>}
                          </>
                        ) : m.walkover ? (
                          <span className="text-xs text-badge/70">Walkover</span>
                        ) : undefined
                      }
                      action={
                        <div className="flex items-center justify-end gap-2">
                          {isDone && (
                            <span className="text-xs font-bold text-badge-win uppercase tracking-wider">Done</span>
                          )}
                          {!!onSubmitScore && (
                            <button
                              type="button"
                              onClick={() => onSubmitScore(m)}
                              className={pillButtonCls('sm', 'clay')}
                            >
                              Score
                            </button>
                          )}
                        </div>
                      }
                      className="border-t border-b-0 px-4 py-2.5"
                    />
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Group edit mode — creator only: rename + reassign players in this group */}
      {isCreator && editMode && (
        <div className="border-t border-fg/10 px-4 py-4 space-y-3">
          {onRenameGroup && (
            <div>
              <label htmlFor={`rr-group-name-${groupIndex}`} className={fieldLabelCls}>
                Group Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`rr-group-name-${groupIndex}`}
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  className={cn(field, 'flex-1')}
                />
                <button
                  onClick={() => onRenameGroup(labelDraft)}
                  disabled={!labelDraft.trim() || labelDraft.trim() === groupLabel}
                  className="px-3 py-1 rounded-xl bg-clay/20 text-clay-fg text-xs font-bold hover:bg-clay/30 transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-fg/70">Reassign Players</p>
          {localPlayers.map((p, idx) => {
            const hasPlayedMatch = matches.some((m) => m.status === 'complete');
            return (
              <div key={p.uid} className="flex items-center gap-2">
                <span className="text-fg/70 text-xs w-4">{idx + 1}.</span>
                <PlayerPicker
                  label={`Choose player ${idx + 1}`}
                  value={p}
                  options={allGroupPlayers}
                  includeLoading
                  onChange={(chosen) => setLocalPlayers((prev) => prev.map((pp, i) => (i === idx ? chosen : pp)))}
                />
              </div>
            );
          })}
          {/* Add a player from another group or the unplaced pool */}
          {(() => {
            const takenIds = new Set(localPlayers.map((p) => p.uid));
            const available = allGroupPlayers.filter((p) => !takenIds.has(p.uid));
            if (!available.length) return null;
            return (
              <div className="flex items-center gap-2">
                <span className="text-fg/70 text-xs w-4">+</span>
                <PlayerPicker
                  label="Add player…"
                  value={null}
                  options={available}
                  onChange={(chosen) => setLocalPlayers((prev) => [...prev, chosen])}
                />
              </div>
            );
          })()}
          <button
            onClick={() => onSaveGroupEdit(groupIndex, localPlayers)}
            className="w-full mt-2 py-1.5 rounded-xl bg-clay text-white text-xs font-bold hover:bg-clay/80 transition-colors"
          >
            Save Group
          </button>
        </div>
      )}
      {confirmationSheet}
    </div>
  );
};
