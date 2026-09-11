import React, { useEffect, useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '../../components/Button';
import { PersonOption } from '../../components/PersonOption';
import { listboxKeyAction } from '../../lib/listboxKeyboard';
import { registerOverlay } from '../../lib/overlayStack';
import { SelectSheet } from '../../components/SelectSheet';
import { field } from '../../components/Input';
import { cn } from '../../lib/cn';
import { DOUBLES_DIVISIONS, DrawConfig } from './types';
import { PLAYER_LOADING } from './utils';

export const PLAYER_LOADING_SENTINEL = '__player_loading__';

type AvailableUser = { id: string; name: string; email: string };

type Props = {
  availableUsers: AvailableUser[];
  currentDraw: DrawConfig | undefined;
  onAdd: (userId: string, partnerName?: string, divisionOverride?: string) => Promise<void>;
};

export const AddPlayerPanel: React.FC<Props> = ({ availableUsers, currentDraw, onAdd }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [divisionOverride, setDivisionOverride] = useState("Men's");
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    return registerOverlay(() => setOpen(false));
  }, [open]);

  if (!currentDraw) return null;

  const isDoubles = currentDraw.tournamentChoice === 'Doubles';
  const needsDivisionPicker = currentDraw.division === 'All';

  const filtered = availableUsers.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()),
  );
  const optionIds = [PLAYER_LOADING_SENTINEL, ...filtered.map((u) => u.id)];
  const isPlayerLoading = selectedUserId === PLAYER_LOADING_SENTINEL;
  const selectedUser = availableUsers.find((u) => u.id === selectedUserId);

  const pickOption = (index: number) => {
    const id = optionIds[index];
    if (!id) return;
    setSelectedUserId(id);
    setOpen(false);
    setSearch('');
  };

  const onPickerKeyDown = (event: React.KeyboardEvent) => {
    const action = listboxKeyAction(event.key, optionIds.length, activeIndex, open);
    if (!action) return;
    event.preventDefault();
    if (action.type === 'open' || action.type === 'move') {
      setOpen(true);
      setActiveIndex(action.index);
    } else if (action.type === 'select') {
      pickOption(action.index);
    } else if (action.type === 'close') {
      setOpen(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setAdding(true);
    try {
      await onAdd(
        selectedUserId,
        isDoubles && partnerName ? partnerName : undefined,
        needsDivisionPicker ? divisionOverride : undefined,
      );
      setSelectedUserId('');
      setPartnerName('');
      setSearch('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl bg-tennis-surface/40 p-4">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="w-4 h-4 text-clay-fg" />
        <span className="text-sm font-bold text-fg uppercase tracking-widest">Add Player</span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls="add-player-list"
            aria-label="Choose player to add"
            onClick={() => setOpen((v) => !v)}
            onKeyDown={onPickerKeyDown}
            className="w-full text-left px-3 py-2 rounded-xl border border-transparent bg-tennis-surface/60 text-sm text-fg hover:border-clay/50 transition-colors focus-visible"
          >
            {isPlayerLoading ? (
              <span className="text-fg/70 italic">{PLAYER_LOADING}</span>
            ) : selectedUser ? (
              selectedUser.name
            ) : (
              <span className="text-fg">Select player…</span>
            )}
          </button>
          {open && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-tennis-deep border border-fg/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-2 border-b border-fg/10">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onPickerKeyDown}
                  aria-label="Search players"
                  placeholder="Search…"
                  className={cn(field, 'bg-transparent')}
                />
              </div>
              <div
                id="add-player-list"
                role="listbox"
                aria-label="Available players"
                className="max-h-52 overflow-y-auto"
              >
                <PersonOption
                  name={PLAYER_LOADING}
                  meta="Placeholder"
                  selected={selectedUserId === PLAYER_LOADING_SENTINEL}
                  onSelect={() => pickOption(0)}
                  className={`rounded-none border-b border-fg/10 px-3 py-2 text-fg/70 italic${activeIndex === 0 ? ' bg-clay/20' : ''}`}
                />
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-fg" role="status">
                    No users found
                  </p>
                ) : (
                  filtered.map((u, index) => (
                    <PersonOption
                      key={u.id}
                      name={u.name}
                      meta={u.email}
                      selected={selectedUserId === u.id}
                      onSelect={() => pickOption(index + 1)}
                      className={`rounded-none px-3 py-2${activeIndex === index + 1 ? ' bg-clay/20' : ''}`}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {needsDivisionPicker && (
          <SelectSheet
            label="Division"
            value={divisionOverride}
            options={DOUBLES_DIVISIONS.map((d) => ({ value: d, label: d }))}
            onChange={setDivisionOverride}
            hideLabel
            className="rounded-xl border-0 bg-tennis-surface/60 px-3 py-2 text-sm"
            wrapperClassName="min-w-[8rem]"
          />
        )}

        {isDoubles && (
          <input
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Partner name…"
            aria-label="Partner name"
            className={cn(field, 'flex-1 min-w-[160px]')}
          />
        )}

        <Button onClick={handleAdd} disabled={!selectedUserId} isLoading={adding} size="md">
          <UserPlus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
};
