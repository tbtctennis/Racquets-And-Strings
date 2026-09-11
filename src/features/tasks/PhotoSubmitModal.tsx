import React, { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, ImageUp, X } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { AlertMessage } from '../../components/AlertMessage';
import { Button } from '../../components/Button';
import { field, fieldLabelCls, fieldRequiredCls, Input } from '../../components/Input';
import { Popover, PopoverRow } from '../../components/Popover';
import { Sheet } from '../../components/Sheet';
import { db } from '../../lib/firebase';
import { listboxKeyAction } from '../../lib/listboxKeyboard';
import { controlChrome } from '../../lib/controlChrome';
import { useAuth } from '../../context/AuthContext';
import { loadCourtList } from './courtList';
import type { CsvCourt } from '../courts/types';
import { MAX_PHOTOS, ReportType, submitPhotoReport } from './photoReportService';

const TYPE_OPTIONS: { id: ReportType; label: string }[] = [
  { id: 'condition', label: 'Improvements/Poor Conditions' },
  { id: 'queue', label: 'Live Queue' },
  { id: 'waiting_board', label: 'Waiting Board' },
];

// Static wait-time reference tables — keyed by "courts per waiting board" (a fixed property of
// the queue setup, not the court's total court count), not computed from the racquet count
// entered. Locations with 4+ courts share one board across 4 courts; smaller locations share one
// board across 2 courts.
type WaitBand = { range: string; wait: string };

const WAIT_TABLE_4: WaitBand[] = [
  { range: '1–4', wait: '10–40 mins' },
  { range: '5–8', wait: '40–70 mins' },
  { range: '>8', wait: '90 mins' },
];

const WAIT_TABLE_2: WaitBand[] = [
  { range: '1–2', wait: '10–40 mins' },
  { range: '3–4', wait: '40–70 mins' },
  { range: '4–5', wait: '70–100 mins' },
  { range: '>5', wait: "It's going to take a while" },
];

function queueWaitTable(numCourts: number): { courtsPerBoard: 2 | 4; bands: WaitBand[] } {
  return numCourts >= 4 ? { courtsPerBoard: 4, bands: WAIT_TABLE_4 } : { courtsPerBoard: 2, bands: WAIT_TABLE_2 };
}

// "Submit a Photo" — the single unified report flow (merges the former "Report"/"Submit a Photo"
// and "Suggest an Improvement" flows into one). Photo(s) + court + type + an optional note; no
// organizer review — every report auto-approves immediately (automated image moderation still
// runs and can remove an unsafe photo after the fact). Anonymous submitters are welcome;
// logged-out reporters may optionally leave an email to get updates.
export const PhotoSubmitModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const [type, setType] = useState<ReportType>('condition');
  const [courtList, setCourtList] = useState<CsvCourt[]>([]);
  const [courts, setCourts] = useState<string[]>([]);
  const [court, setCourt] = useState('');
  const [courtSearch, setCourtSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [courtActiveIndex, setCourtActiveIndex] = useState(0);
  const [note, setNote] = useState('');
  const [racquetsInQueue, setRacquetsInQueue] = useState('');
  const [waitingBoards, setWaitingBoards] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Best-effort mailing-list opt-in for logged-out reporters. Called from submit (if they filled
  // the pre-submit field) and from the success screen. Idempotent enough: once `subscribed` is
  // set the input is replaced by a confirmation, so it can't be fired twice for the same address.
  const saveEmail = async () => {
    const addr = email.trim();
    if (!addr || subscribed) return;
    try {
      await addDoc(collection(db, 'mailing_list'), {
        email: addr,
        source: 'submit_a_photo',
        created_at: new Date().toISOString(),
      });
      setSubscribed(true);
    } catch {
      /* never blocks the report itself */
    }
  };

  useEffect(() => {
    loadCourtList().then((list) => {
      setCourtList(list);
      setCourts([...new Set(list.map((c) => c.dropdown))].sort((a, b) => a.localeCompare(b)));
    });
  }, []);

  const courtMatches = useMemo(() => {
    const q = courtSearch.trim().toLowerCase();
    if (!q) return courts.slice(0, 8);
    return courts.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [courts, courtSearch]);

  const selectedCourtNumCourts = useMemo(
    () => courtList.find((c) => c.dropdown === court)?.numCourts ?? null,
    [courtList, court],
  );

  const waitTable = useMemo(
    () => (selectedCourtNumCourts != null ? queueWaitTable(selectedCourtNumCourts) : null),
    [selectedCourtNumCourts],
  );

  const addFiles = (picked: File[]) => {
    if (picked.length === 0) return;
    if (picked.find((f) => !f.type.startsWith('image/'))) {
      setError('Please choose image files only.');
      return;
    }
    if (picked.find((f) => f.size > 5 * 1024 * 1024)) {
      setError('Each image must be under 5 MB.');
      return;
    }
    setError('');
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!court) {
      setError('Please select a court.');
      return;
    }
    if (!note.trim()) {
      setError('Please add a note.');
      return;
    }
    if (type === 'queue' && !racquetsInQueue.trim()) {
      setError('Please enter the number of racquets in queue.');
      return;
    }
    if (type === 'waiting_board' && !waitingBoards.trim()) {
      setError('Please enter the number of waiting boards.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitPhotoReport({
        uid: user?.uid ?? null,
        userName: profile?.user.name || '',
        type,
        courtName: court,
        files,
        note,
        ...(type === 'queue' && racquetsInQueue.trim() ? { racquetsInQueue: Number(racquetsInQueue) } : {}),
        ...(type === 'waiting_board' && waitingBoards.trim() ? { waitingBoards: Number(waitingBoards) } : {}),
        onProgress: setProgress,
      });
      // Logged-out reporter left an email → add to the mailing list (best-effort, never blocks).
      if (!user && email.trim()) void saveEmail();
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet onClose={onClose} title="Submit a Report" maxWidthClassName="max-w-md">
      <div className="p-6 pt-2 space-y-5">
        {success ? (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-badge-win" />
            </div>
            <h3 className="text-lg font-bold text-fg">Completed.</h3>

            {!user && !subscribed && (
              <div className="text-left rounded-2xl bg-fg/[0.03] p-4 space-y-3">
                <p className="text-sm font-semibold text-fg">Want to stay in the loop?</p>
                <p className="text-xs text-fg/70">Leave your email to hear about upcoming events. Totally optional.</p>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {/* This box used to be decorative: the mailing-list write happened during submit,
                    before this screen existed, so anything typed here was silently discarded and
                    the reporter believed they'd subscribed. */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={!email.trim()}
                  onClick={() => void saveEmail()}
                >
                  Keep me posted
                </Button>
              </div>
            )}
            {!user && subscribed && <p className="text-xs text-badge-win font-semibold">You&rsquo;re on the list.</p>}

            {/* Flush an address typed but not submitted, so closing doesn't throw it away. */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                void saveEmail().finally(onClose);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            {error && <AlertMessage tone="error">{error}</AlertMessage>}

            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setType(o.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${controlChrome(type === o.id)}`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 relative">
              <label htmlFor="photo-court" className={fieldLabelCls}>
                Select Court <span className={fieldRequiredCls}>*</span>
              </label>
              <input
                id="photo-court"
                type="text"
                role="combobox"
                aria-expanded={showDropdown && courtMatches.length > 0}
                aria-controls="photo-court-list"
                aria-autocomplete="list"
                aria-activedescendant={
                  showDropdown && courtMatches[courtActiveIndex] ? `photo-court-opt-${courtActiveIndex}` : undefined
                }
                placeholder="Search courts…"
                value={court || courtSearch}
                onChange={(e) => {
                  setCourt('');
                  setCourtSearch(e.target.value);
                  setShowDropdown(true);
                  setCourtActiveIndex(0);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                onKeyDown={(event) => {
                  const open = showDropdown && courtMatches.length > 0;
                  const action = listboxKeyAction(event.key, courtMatches.length, courtActiveIndex, open);
                  if (!action) return;
                  event.preventDefault();
                  if (action.type === 'open' || action.type === 'move') {
                    setShowDropdown(true);
                    setCourtActiveIndex(action.index);
                  } else if (action.type === 'select') {
                    const next = courtMatches[action.index];
                    if (!next) return;
                    setCourt(next);
                    setCourtSearch('');
                    setShowDropdown(false);
                  } else if (action.type === 'close') {
                    setShowDropdown(false);
                  }
                }}
                className={field}
              />
              <Popover
                id="photo-court-list"
                open={showDropdown && courtMatches.length > 0}
                onClose={() => setShowDropdown(false)}
                aria-label="Court choices"
              >
                {courtMatches.map((c, index) => (
                  <PopoverRow
                    key={c}
                    id={`photo-court-opt-${index}`}
                    aria-selected={index === courtActiveIndex}
                    className={index === courtActiveIndex ? 'bg-clay/20' : undefined}
                    onClick={() => {
                      setCourt(c);
                      setCourtSearch('');
                      setShowDropdown(false);
                    }}
                  >
                    {c}
                  </PopoverRow>
                ))}
              </Popover>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-fg/70 uppercase tracking-widest">Photos</p>
                <span className="text-xs text-fg/70">Up to {MAX_PHOTOS}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Take Photo — opens the camera directly on mobile. */}
                <label
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-fg/20 cursor-pointer hover:border-fg/40 transition-colors ${files.length >= MAX_PHOTOS ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <Camera className="w-5 h-5 text-fg/70 shrink-0" />
                  <span className="text-sm text-fg/70">Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files ?? []));
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                {/* Upload — opens the gallery / file picker; multi-select. */}
                <label
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-fg/20 cursor-pointer hover:border-fg/40 transition-colors ${files.length >= MAX_PHOTOS ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <ImageUp className="w-5 h-5 text-fg/70 shrink-0" />
                  <span className="text-sm text-fg/70">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files ?? []));
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {files.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  {files.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex items-center gap-1.5 text-xs text-fg/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-badge-win shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        aria-label="Remove photo"
                        className="text-fg/70 hover:text-fg transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {submitting && (
                <div className="w-full h-1.5 rounded-full bg-fg/10 overflow-hidden">
                  <div
                    className="h-full bg-clay rounded-full transition-all duration-motion"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {type === 'waiting_board' && (
              <Input
                label="How many waiting boards?"
                required
                type="number"
                min={0}
                inputMode="numeric"
                value={waitingBoards}
                onChange={(e) => setWaitingBoards(e.target.value)}
                placeholder="e.g. 2"
              />
            )}

            {type === 'queue' && (
              <div className="space-y-3">
                <Input
                  label="Racquets in Queue"
                  required
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={racquetsInQueue}
                  onChange={(e) => setRacquetsInQueue(e.target.value)}
                  placeholder="e.g. 3"
                />

                {waitTable && (
                  <div className="rounded-2xl bg-fg/[0.03] p-3 space-y-2">
                    <p className="text-xs font-bold text-fg/70 uppercase tracking-widest">Approximate Wait Time</p>
                    <p className="text-xs text-fg/70">Courts per waiting board: {waitTable.courtsPerBoard}</p>
                    <div className="space-y-1">
                      {waitTable.bands.map((b) => (
                        <div key={b.range} className="flex items-center justify-between text-xs">
                          <span className="text-fg/70">{b.range} racquets</span>
                          <span className="font-semibold text-fg">{b.wait}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="photo-note" className={fieldLabelCls}>
                Note <span className={fieldRequiredCls}>*</span>
              </label>
              <textarea
                id="photo-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Tell us what's going on…"
                className={field}
              />
            </div>

            {/* Logged-out reporters can opt into updates — totally optional, stays anonymous otherwise. */}
            {!user && (
              <Input
                label="Get updates"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} isLoading={submitting} className="flex-1">
                Submit
              </Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
};
