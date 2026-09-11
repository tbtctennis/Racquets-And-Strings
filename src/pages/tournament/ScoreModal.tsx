import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { FieldError } from '../../components/FieldError';
import { field, fieldLabelCls } from '../../components/Input';
import { cn } from '../../lib/cn';
import { Popover, PopoverRow } from '../../components/Popover';
import { Sheet } from '../../components/Sheet';
import { loadCourtList } from '../../features/tasks/courtList';
import { listboxKeyAction } from '../../lib/listboxKeyboard';
import { ScoreForm } from './types';
import { formatPersonName } from '../../utils/nameFormatting';

// A player, and a title, is all ScoreModal needs to know about the thing being scored — it
// doesn't care whether that's a tournament `matches` doc or a ladder challenge doc, so both
// Tournament.tsx (bracket matches) and Matches.tsx (accepted challenges) can reuse it as-is.
export type ScoreMatchInfo = {
  title: string;
  player1: { uid: string; name: string };
  player2: { uid: string; name: string };
};

type Props = {
  matchInfo: ScoreMatchInfo;
  scoreForm: ScoreForm;
  onChange: (form: ScoreForm) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  isCreatorSubmit?: boolean | undefined;
  /** Organizer-only all-zero result that advances the selected winner. */
  walkover?: { checked: boolean; onChange: (checked: boolean) => void } | undefined;
  /**
   * Organizer-only, and only for a match that already has a score: wipe the result and the points
   * it awarded, returning the match to unplayed. Omitted for an unplayed match — there is nothing
   * to reset — and for players, who can't write the official record at all.
   */
  onReset?: (() => Promise<void> | void) | undefined;
};

// Mobile-first score entry (wireframe 1d): winner picked with two large tap-cards and scores
// entered as bounded number inputs. Set values stay strings in ScoreForm.
export const ScoreModal: React.FC<Props> = ({
  matchInfo,
  scoreForm,
  onChange,
  onClose,
  onSubmit,
  isCreatorSubmit,
  walkover,
  onReset,
}) => {
  const isWalkover = !!walkover?.checked;
  const winnerMissing = !scoreForm.winnerUserId;
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [courts, setCourts] = useState<string[]>([]);
  const [courtSearch, setCourtSearch] = useState('');
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);
  const [courtActiveIndex, setCourtActiveIndex] = useState(0);

  useEffect(() => {
    loadCourtList().then((list) =>
      setCourts([...new Set(list.map((c) => c.dropdown))].sort((a, b) => a.localeCompare(b))),
    );
  }, []);

  const courtMatches = useMemo(() => {
    const q = courtSearch.trim().toLowerCase();
    if (!q) return courts.slice(0, 8);
    return courts.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [courts, courtSearch]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setSubmitting(false);
    }
  };

  const setSetValue = (index: number, side: 'mine' | 'opponent', v: string) => {
    const sets = [...scoreForm.sets];
    const current = sets[index] ?? { mine: '', opponent: '' };
    sets[index] = { ...current, [side]: String(v) };
    onChange({ ...scoreForm, sets });
  };

  const winnerOptions = [matchInfo.player1, matchInfo.player2];

  const mineLabel = isCreatorSubmit ? formatPersonName(matchInfo.player1.name) : 'My score';
  const oppLabel = isCreatorSubmit ? formatPersonName(matchInfo.player2.name) : 'Opponent';

  return (
    <Sheet onClose={onClose} title="Submit score" maxWidthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="text-center mb-4 pr-10">
          <p className="text-xs uppercase tracking-widest text-clay-fg font-black mb-2">Submit Score</p>
          <h2 className="text-2xl font-black text-fg">{matchInfo.title}</h2>
        </div>

        <div className="flex items-center gap-2 mb-5 px-3 py-2.5 text-sm text-clay-fg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {isCreatorSubmit
            ? 'Entering score as event organizer. This will be accepted immediately.'
            : 'Pick the winner, enter the games, and submit. The organizer will confirm it.'}
        </div>

        {/* Winner — two large tap-cards. */}
        <p className="text-xs font-bold uppercase tracking-widest text-fg/70 mb-2">Winner</p>
        <div
          className="flex gap-2.5 mb-6"
          role="radiogroup"
          aria-label="Winner"
          onKeyDown={(event) => {
            if (
              event.key !== 'ArrowRight' &&
              event.key !== 'ArrowLeft' &&
              event.key !== 'ArrowDown' &&
              event.key !== 'ArrowUp'
            )
              return;
            event.preventDefault();
            const idx = winnerOptions.findIndex((p) => p.uid === scoreForm.winnerUserId);
            const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
            const next = winnerOptions[(Math.max(idx, 0) + delta + winnerOptions.length) % winnerOptions.length];
            if (!next) return;
            onChange({ ...scoreForm, winnerUserId: next.uid || '' });
          }}
        >
          {winnerOptions.map((p) => {
            const selected = scoreForm.winnerUserId === p.uid;
            return (
              <button
                key={p.uid}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected || !scoreForm.winnerUserId ? 0 : -1}
                onClick={() => onChange({ ...scoreForm, winnerUserId: p.uid || '' })}
                className={`flex-1 rounded-2xl border-2 px-3 py-4 text-center transition-colors focus-visible ${
                  selected ? 'border-clay bg-clay/10' : 'border-fg/10 bg-fg/5 hover:border-fg/25'
                }`}
              >
                <span
                  className={`mx-auto mb-2 w-5 h-5 rounded-full flex items-center justify-center ${
                    selected ? 'bg-clay' : 'border-2 border-fg/20'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 text-fg" />}
                </span>
                <span className="block text-sm font-bold text-fg truncate">{formatPersonName(p.name)}</span>
              </button>
            );
          })}
        </div>

        {/* Select Court — same search dropdown as the rest of the site (PhotoSubmitModal, Signup). */}
        <div className="space-y-1.5 relative mb-6">
          <label htmlFor="score-court" className={fieldLabelCls}>
            Court
          </label>
          <input
            id="score-court"
            type="text"
            role="combobox"
            aria-expanded={showCourtDropdown && courtMatches.length > 0}
            aria-controls="score-court-list"
            aria-autocomplete="list"
            aria-activedescendant={
              showCourtDropdown && courtMatches[courtActiveIndex] ? `score-court-opt-${courtActiveIndex}` : undefined
            }
            placeholder="Search courts…"
            value={scoreForm.court || courtSearch}
            onChange={(e) => {
              onChange({ ...scoreForm, court: '' });
              setCourtSearch(e.target.value);
              setShowCourtDropdown(true);
              setCourtActiveIndex(0);
            }}
            onFocus={() => setShowCourtDropdown(true)}
            onBlur={() => setTimeout(() => setShowCourtDropdown(false), 150)}
            onKeyDown={(event) => {
              const open = showCourtDropdown && courtMatches.length > 0;
              const action = listboxKeyAction(event.key, courtMatches.length, courtActiveIndex, open);
              if (!action) return;
              event.preventDefault();
              if (action.type === 'open' || action.type === 'move') {
                setShowCourtDropdown(true);
                setCourtActiveIndex(action.index);
              } else if (action.type === 'select') {
                const court = courtMatches[action.index];
                if (!court) return;
                onChange({ ...scoreForm, court });
                setCourtSearch('');
                setShowCourtDropdown(false);
              } else if (action.type === 'close') {
                setShowCourtDropdown(false);
              }
            }}
            className={field}
          />
          <Popover
            id="score-court-list"
            open={showCourtDropdown && courtMatches.length > 0}
            onClose={() => setShowCourtDropdown(false)}
            aria-label="Court choices"
          >
            {courtMatches.map((c, index) => (
              <PopoverRow
                key={c}
                id={`score-court-opt-${index}`}
                aria-selected={index === courtActiveIndex}
                className={index === courtActiveIndex ? 'bg-clay/20' : undefined}
                onClick={() => {
                  onChange({ ...scoreForm, court: c });
                  setCourtSearch('');
                  setShowCourtDropdown(false);
                }}
              >
                {c}
              </PopoverRow>
            ))}
          </Popover>
        </div>

        {/* Set scores are intentionally number inputs so users can enter 0–99 directly. */}
        <div className={`space-y-4 ${isWalkover ? 'opacity-50 pointer-events-none' : ''}`}>
          {scoreForm.sets.map((set, index) => (
            <div key={index}>
              <p className="text-fg font-bold text-sm mb-2">Set {index + 1}</p>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
                <div>
                  <span className="block truncate text-xs text-fg/70 font-semibold mb-1">{mineLabel}</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={set.mine}
                    disabled={isWalkover}
                    onChange={(e) => setSetValue(index, 'mine', e.target.value)}
                    aria-label={`${mineLabel} set ${index + 1} games`}
                    className={cn(field, 'text-lg font-bold')}
                  />
                </div>
                <div>
                  <span className="block truncate text-xs text-fg/70 font-semibold mb-1">{oppLabel}</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={set.opponent}
                    disabled={isWalkover}
                    onChange={(e) => setSetValue(index, 'opponent', e.target.value)}
                    aria-label={`${oppLabel} set ${index + 1} games`}
                    className={cn(field, 'text-lg font-bold')}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex flex-wrap items-start gap-x-5 gap-y-2 px-1">
            {walkover && <Checkbox checked={walkover.checked} onChange={walkover.onChange} label="Record walkover" />}
          </div>
          {isWalkover && (
            <p className="px-1 text-xs text-fg/70">
              Recorded as an organizer-only walkover: 0–0–0 score and the selected winner advances.
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-2.5">
          <Button
            type="submit"
            className="flex-1"
            isLoading={submitting}
            disabled={submitting || resetting || winnerMissing}
          >
            {isWalkover ? 'Record Walkover' : isCreatorSubmit ? 'Record Score' : 'Submit Score'}
          </Button>
          {onReset && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              isLoading={resetting}
              disabled={submitting || resetting}
              onClick={async () => {
                setResetting(true);
                try {
                  await onReset();
                } finally {
                  setResetting(false);
                }
              }}
            >
              Reset Score
            </Button>
          )}
        </div>
        {winnerMissing && <FieldError>Choose a winner before submitting.</FieldError>}
      </form>
    </Sheet>
  );
};
