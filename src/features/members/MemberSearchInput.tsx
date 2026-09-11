import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Member, useMemberRoster } from './useMemberRoster';
import { PersonOption } from '../../components/PersonOption';
import { field, fieldHintCls, fieldLabelCls } from '../../components/Input';
import { cn } from '../../lib/cn';
import { listboxKeyAction } from '../../lib/listboxKeyboard';

/** `memberId: null` means the name was typed by hand for someone who isn't on the app. */
export type MemberPick = { name: string; memberId: string | null };

type Props = {
  label: string;
  /** Current selection, or null when nothing is picked yet. */
  value: MemberPick | null;
  onChange: (pick: MemberPick | null) => void;
  /** Drop one member from the results — usually the signed-in user. */
  excludeId?: string | undefined;
  /**
   * Allow a name that isn't an app member. Off means the field only accepts a real account.
   * When on, whatever is typed can be submitted as a `guest` pick.
   */
  allowGuest?: boolean | undefined;
  placeholder?: string | undefined;
  /** Shown under the field when nothing is selected. */
  hint?: string | undefined;
};

const MAX_RESULTS = 8;

/**
 * Name field with member autosearch, plus an optional free-text fallback for someone who isn't
 * on the app.
 *
 * Extracted from the inline search in ClaimModal's ambassador flow so the doubles partner fields
 * can use it too — those are free text today, and a typo there silently breaks team pairing,
 * because a doubles team is only recognised when both partners name each other exactly.
 */
export const MemberSearchInput: React.FC<Props> = ({
  label,
  value,
  onChange,
  excludeId,
  allowGuest = false,
  placeholder = 'Search members…',
  hint,
}) => {
  const members = useMemberRoster(excludeId);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = React.useId();
  const inputId = React.useId();

  const matches = useMemo((): Member[] => {
    const q = search.trim().toLowerCase();
    if (!q) return members.slice(0, MAX_RESULTS);
    return members.filter((m) => m.name.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [members, search]);

  const typed = search.trim();
  const exactMatch = matches.some((m) => m.name.toLowerCase() === typed.toLowerCase());
  const canUseGuest = allowGuest && typed.length >= 3 && !exactMatch;
  const itemCount = matches.length + (canUseGuest ? 1 : 0);
  const listOpen = itemCount > 0;

  const pickIndex = (index: number) => {
    if (index < matches.length) {
      const member = matches[index];
      if (member) onChange({ name: member.name, memberId: member.id });
      return;
    }
    if (canUseGuest) onChange({ name: typed, memberId: null });
  };

  if (value) {
    return (
      <div className="space-y-1.5">
        <label className={fieldLabelCls}>{label}</label>
        <div className="flex items-center justify-between rounded-2xl bg-clay/15 px-4 py-2.5">
          <span className="min-w-0 text-sm font-bold text-fg truncate">
            {value.name}
            {value.memberId === null && <span className="ml-1.5 font-medium text-fg">(not on the app)</span>}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onChange(null);
            }}
            className="shrink-0 ml-3 text-xs font-bold text-fg hover:text-clay-fg focus-visible"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className={fieldLabelCls}>
        {label}
      </label>
      <div className="relative">
        <Search className="w-4 h-4 text-fg absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            const action = listboxKeyAction(event.key, itemCount, activeIndex, listOpen);
            if (!action) return;
            event.preventDefault();
            if (action.type === 'open' || action.type === 'move') setActiveIndex(action.index);
            else if (action.type === 'select') pickIndex(action.index);
            else if (action.type === 'close') setSearch('');
          }}
          className={cn(field, 'pl-10')}
        />
      </div>

      {typed && !listOpen && (
        <p role="status" className="px-1 text-sm text-fg">
          No members found
        </p>
      )}

      {listOpen && (
        <div
          id={listId}
          role="listbox"
          aria-label={`${label} choices`}
          className="max-h-40 overflow-y-auto rounded-2xl bg-tennis-dark/60 p-1"
        >
          {matches.map((m, index) => (
            <PersonOption
              key={m.id}
              name={m.name}
              onSelect={() => onChange({ name: m.name, memberId: m.id })}
              className={`rounded-xl px-3 py-2${activeIndex === index ? ' bg-clay/20' : ''}`}
            />
          ))}
          {canUseGuest && (
            <PersonOption
              name={typed}
              meta="Not on the app"
              onSelect={() => onChange({ name: typed, memberId: null })}
              className={`rounded-xl px-3 py-2${activeIndex === matches.length ? ' bg-clay/20' : ''}`}
            />
          )}
        </div>
      )}

      {hint && <p className={fieldHintCls}>{hint}</p>}
    </div>
  );
};
