import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TournamentMatch, TournamentPlayer } from './types';
import { BYE, PLAYER_LOADING, getMatchDisplayFlags } from './utils';
import { formatPersonName } from '../../utils/nameFormatting';
import { memberProfileHref } from '../../features/members/memberProfileHref';
import { AlertMessage } from '../../components/AlertMessage';
import { useConfirmSheet } from '../../components/useConfirmSheet';
import { PersonOption } from '../../components/PersonOption';
import { Popover, popoverRowClassName } from '../../components/Popover';
import { SeedBadge, seedForUid } from '../../components/PersonRow';

// One match cell, shared by the desktop grid (BracketView) and the mobile accordion
// (BracketAccordion). The sections and the conditions that show them are identical in both —
// status dot, two player rows, score line, final-winner banner, creator/player submit buttons —
// so only the sizing differs. Those differences live in VARIANTS below; everything else is shared.
//
// PlayerSelect lives here rather than in BracketView so this file has no import back into either
// bracket component (that would be a cycle).

type Variant = 'grid' | 'stack';

const VARIANTS = {
  // Desktop: dense cells sized to the bracket grid.
  grid: {
    card: 'relative rounded-xl bg-tennis-dark/60',
    dot: 'absolute top-1.5 right-1.5 w-2 h-2 rounded-full z-10',
    row: 'h-8 border-b border-fg/10 flex items-center px-2 text-sm font-semibold',
    lastRowBorder: true,
    check: false,
    score: 'border-t border-fg/10 px-2 py-0.5 text-xs text-fg/70 font-mono tracking-wide',
    winner: 'border-t border-fg/10 px-2 py-1 text-xs font-black text-clay-fg',
    creatorBtn:
      'w-full border-t border-fg/10 px-2 py-1 text-xs text-fg/70 hover:text-clay-fg transition-colors text-center leading-tight',
    playerBtn:
      'w-full border-t border-fg/10 px-2 py-1 text-xs text-fg/70 hover:text-clay-fg transition-colors text-center leading-tight',
    submitted: 'w-full border-t border-fg/10 px-2 py-1 text-xs text-badge-win text-center leading-tight',
  },
  // Mobile: roomier, with 44px touch targets.
  stack: {
    card: 'relative rounded-xl bg-tennis-dark/60 overflow-hidden',
    dot: 'absolute top-2 right-2 w-2 h-2 rounded-full z-10',
    row: 'min-h-[44px] flex items-center px-3 text-sm font-semibold',
    lastRowBorder: false,
    check: true,
    score: 'border-t border-fg/10 px-3 py-1 text-xs text-fg/70 font-mono tracking-wide',
    winner: 'border-t border-fg/10 px-3 py-1.5 text-xs font-black text-clay-fg',
    creatorBtn:
      'w-full border-t border-fg/10 px-3 py-2 text-xs font-bold text-fg/70 hover:text-clay-fg transition-colors text-center bg-fg/[0.03]',
    playerBtn:
      'w-full border-t border-fg/10 px-3 py-2 text-xs font-bold text-clay-fg transition-colors text-center bg-clay/10',
    submitted: 'w-full border-t border-fg/10 px-3 py-2 text-xs text-badge-win text-center',
  },
} as const;

type PlayerSelectProps = {
  matchId: string;
  slot: 'player_1' | 'player_2';
  currentUserId: string;
  currentName: string;
  players: TournamentPlayer[];
  onSelect: (matchId: string, slot: 'player_1' | 'player_2', player: TournamentPlayer | null) => void;
  /** Organizer withdraws this player; the server resolves pending matches as walkovers. */
  onRemovePlayer?: ((uid: string) => void) | undefined;
};

export const PlayerSelect: React.FC<PlayerSelectProps> = ({
  matchId,
  slot,
  currentUserId,
  currentName,
  players,
  onSelect,
  onRemovePlayer,
}) => {
  const selectValue = currentName === PLAYER_LOADING ? PLAYER_LOADING : currentUserId || '';
  const [open, setOpen] = useState(false);
  const { ask: askConfirmation, sheet: confirmationSheet } = useConfirmSheet();
  const selectedLabel =
    selectValue === PLAYER_LOADING
      ? PLAYER_LOADING
      : formatPersonName(players.find((p) => p.uid === selectValue)?.name, BYE);
  const displayName = formatPersonName(currentName);
  const choose = (player: TournamentPlayer | null) => {
    onSelect(matchId, slot, player);
    setOpen(false);
  };
  return (
    <div className="relative h-8 border-b border-fg/10 flex items-center px-1 bg-clay/10">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Choose ${slot === 'player_1' ? 'first' : 'second'} player`}
        onClick={() => setOpen((value) => !value)}
        className="flex min-w-0 flex-1 items-center text-left text-xs text-fg outline-none focus-visible:ring-2 focus-visible:ring-clay"
      >
        <SeedBadge seed={seedForUid(selectValue, players)} />
        <span className="min-w-0 truncate">{selectedLabel}</span>
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        aria-label={`${slot === 'player_1' ? 'First' : 'Second'} player choices`}
      >
        <PersonOption
          name={BYE}
          selected={!selectValue}
          onSelect={() => choose(null)}
          className={popoverRowClassName}
        />
        <PersonOption
          name={PLAYER_LOADING}
          selected={selectValue === PLAYER_LOADING}
          onSelect={() => choose({ uid: '', name: PLAYER_LOADING, participantId: '' })}
          className={popoverRowClassName}
        />
        {players.map((p) => (
          <PersonOption
            key={p.uid}
            name={p.name}
            selected={p.uid === selectValue}
            onSelect={() => choose(p)}
            className={popoverRowClassName}
          />
        ))}
      </Popover>
      {/* Withdrawal keeps the registration and match history; the server resolves only pending work. */}
      {onRemovePlayer && currentUserId && currentName !== PLAYER_LOADING && (
        <button
          type="button"
          aria-label={`Withdraw ${displayName}`}
          title="Withdraw player"
          onClick={() =>
            askConfirmation({
              title: 'Withdraw this player?',
              message: `Withdraw ${displayName}? Matches you have not played become walkovers. Played matches stay as they are.`,
              confirmLabel: 'Withdraw player',
              onConfirm: () => onRemovePlayer(currentUserId),
            })
          }
          className="shrink-0 p-1 rounded-xl text-fg/70 opacity-70 hover:opacity-100 hover:text-badge-loss hover:bg-red-500/10 transition-colors"
        >
          <span className="text-badge font-black text-sm leading-none">!</span>
        </button>
      )}
      {confirmationSheet}
    </div>
  );
};

type Props = {
  match: TournamentMatch;
  variant: Variant;
  isFinal: boolean;
  editMode?: boolean | undefined;
  editPlayers?: TournamentPlayer[] | undefined;
  /** Draw players used to resolve seed numbers. Falls back to `editPlayers`. */
  players?: TournamentPlayer[] | undefined;
  onEditPlayer?:
    ((matchId: string, slot: 'player_1' | 'player_2', player: TournamentPlayer | null) => void) | undefined;
  onRemovePlayer?: ((uid: string) => void) | undefined;
  isCreator?: boolean | undefined;
  onSubmitScore?: ((match: TournamentMatch) => void) | undefined;
  submittableMatchIds?: Set<string> | undefined;
  pendingMatchIds?: Set<string> | undefined;
};

export const MatchCard: React.FC<Props> = ({
  match,
  variant,
  isFinal,
  editMode,
  editPlayers = [],
  players = [],
  onEditPlayer,
  onRemovePlayer,
  isCreator,
  onSubmitScore,
  submittableMatchIds,
  pendingMatchIds,
}) => {
  const v = VARIANTS[variant];
  const seedPlayers = players.length > 0 ? players : editPlayers;
  const { isEditable, scoreText, showDot, showCreatorSubmit, showPlayerSubmit, alreadySubmitted } =
    getMatchDisplayFlags(match, {
      editMode,
      hasEditHandler: !!onEditPlayer,
      isCreator,
      hasSubmitHandler: !!onSubmitScore,
      submittableMatchIds,
      pendingMatchIds,
    });
  const winnerHref = memberProfileHref(match.winner_uid);

  return (
    <div className={v.card}>
      {showDot && (
        <span
          className={`${v.dot} ${match.status === 'complete' ? 'bg-green-400' : 'bg-orange-400'}`}
          title={match.status === 'complete' ? 'Done' : 'Pending'}
        />
      )}

      {(['player_1', 'player_2'] as const).map((slot) => {
        const name = slot === 'player_1' ? match.player_1_name : match.player_2_name;
        const uid = slot === 'player_1' ? match.player_1_uid : match.player_2_uid;
        const isWinner = !!match.winner_uid && match.winner_uid === uid;
        const border = slot === 'player_1' || v.lastRowBorder ? 'border-b border-fg/10' : '';

        const profileHref = memberProfileHref(uid);
        const displayName = formatPersonName(name) || ' ';

        return isEditable ? (
          <PlayerSelect
            key={slot}
            matchId={match.id}
            slot={slot}
            currentUserId={uid}
            currentName={name}
            players={editPlayers}
            onSelect={onEditPlayer!}
            onRemovePlayer={onRemovePlayer}
          />
        ) : (
          <div key={slot} className={`${v.row} ${border} ${isWinner ? 'text-clay-fg' : 'text-fg'}`}>
            <span className="flex min-w-0 flex-1 items-center overflow-hidden">
              <SeedBadge seed={seedForUid(uid, seedPlayers)} />
              {profileHref ? (
                <Link to={profileHref} className="truncate hover:text-clay-fg transition-colors">
                  {displayName}
                </Link>
              ) : (
                <span className="truncate">{displayName}</span>
              )}
            </span>
            {v.check && isWinner && <span className="ml-auto text-xs">✓</span>}
          </div>
        );
      })}

      {scoreText && <div className={v.score}>{scoreText}</div>}

      {match.score_disputed && (
        <AlertMessage tone="error" className="m-2 text-xs">
          Conflicting result reported. The organizer must review this match.
        </AlertMessage>
      )}

      {isFinal && match.winner_name ? (
        <div className={v.winner}>
          Winner:{' '}
          {winnerHref ? (
            <Link to={winnerHref} className="hover:text-clay-fg transition-colors">
              {formatPersonName(match.winner_name)}
            </Link>
          ) : (
            formatPersonName(match.winner_name)
          )}
        </div>
      ) : null}

      {showCreatorSubmit && (
        <button type="button" onClick={() => onSubmitScore!(match)} className={v.creatorBtn}>
          {match.status === 'complete' ? 'Edit score' : 'Enter score'}
        </button>
      )}

      {showPlayerSubmit &&
        (alreadySubmitted ? (
          <div className={v.submitted}>Recorded ✓</div>
        ) : (
          <button type="button" onClick={() => onSubmitScore!(match)} className={v.playerBtn}>
            Submit score
          </button>
        ))}
    </div>
  );
};
