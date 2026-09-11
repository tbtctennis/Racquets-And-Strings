import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Apple, Camera, Check, Chrome, Clock, MapPin, Pencil, Star, Users, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import IntlTelInput from '@intl-tel-input/react/with-utils';
import 'intl-tel-input/styles';
import { useAuth } from '../../../context/AuthContext';
import { storage } from '../../../lib/firebase';
import { AlertMessage } from '../../../components/AlertMessage';
import { Button } from '../../../components/Button';
import { Spinner } from '../../../components/Spinner';
import { PersonChip } from '../../../components/PersonChip';
import { field, Input } from '../../../components/Input';
import { Checkbox } from '../../../components/Checkbox';
import { Popover, PopoverRow } from '../../../components/Popover';
import { Switch } from '../../../components/Switch';
import { listboxKeyAction } from '../../../lib/listboxKeyboard';
import { controlChrome } from '../../../lib/controlChrome';
import { RacquetIcon } from '../../../components/RacquetIcon';
import { ProfileCard, type ProfileCardMatch } from '../../../components/ProfileCard';
import { AvailabilityTagPicker } from './AvailabilityModal';
import { usePayments } from '../../payments/usePayments';
import { SELECTABLE_SKILL_LEVELS, leagueAgeCategory, leagueDivision } from '../../../utils/skillLevels';
import {
  defaultCourtOptions,
  extractCourtsWithCoords,
  extractDropdownCourts,
  getCourtSuggestions,
  mergeCourtOptions,
} from '../../signup/utils/courtSearch';
import { zoneFromCourts, ZONE_NAMES } from '../../../utils/zones';
import { useCourtResolutions } from '../../courts/courtResolutionService';
import { Sheet } from '../../../components/Sheet';
import { formatPhone } from '../../../utils/formatPhone';
import { skillBand } from '../../tournament/domain/placement';
import { getFavouritePlayerSuggestions, useFavouritePlayerOptions } from '../favouritePlayers';
import { BadgePicker } from '../../tasks/BadgePicker';
import { DonationSurface } from '../../payments/DonationSurface';
import type { Counters } from '../../tasks/taskCatalog';
import { ContactMethod, TaskProgress } from '../../../types';
import { EMAIL_CHANGE_UNSUPPORTED_MESSAGE, OAUTH_PROVIDER_LABEL, emailChangeReauthMethod } from '../changeEmailAuth';

type Actions = {
  updateName: (name: string) => Promise<boolean>;
  updatePhone: (phone: string) => Promise<boolean>;
  updateWhatsappContact: (whatsappContact: string, sameAsPhone: boolean) => Promise<boolean>;
  updateBio: (bio: string) => Promise<boolean>;
  updateAvatar: (url: string) => Promise<boolean>;
  updateSkills: (skill: number, pref: string) => Promise<boolean>;
  updateLeagueAgeCategory: (
    league: "Men's" | "Women's" | '',
    ageCategory: 'Retired Pro' | 'Juniors' | '',
  ) => Promise<boolean>;
  updateDisplayBadges: (badgeIds: string[]) => Promise<boolean>;
  updatePreferredCourts: (courts: string[], zone: string) => Promise<boolean>;
  updatePreferredZone: (zone: string) => Promise<boolean>;
  updateAvailableToPlay: (available: boolean) => Promise<boolean>;
  updateAvailabilityTags: (tags: string[]) => Promise<boolean>;
  updateFavouritePlayers: (players: string[]) => Promise<boolean>;
  updateEmailNotifications: (enabled: boolean) => Promise<boolean>;
  updateContactMethods: (methods: ContactMethod[]) => Promise<boolean>;
  changeEmail: (email: string, password?: string) => Promise<boolean | undefined>;
  refreshEmailChange: () => Promise<void>;
  dismissEmailChange: () => void;
};

interface Props {
  actions: Actions;
  updateLoading: boolean;
  message?: { text: string; type: 'success' | 'error' } | null;
  emailVerificationSentTo?: string | null;
  progress: TaskProgress | null;
  counters: Counters;
  matches?: ProfileCardMatch[];
  pgWonPct?: string;
}

type Row =
  | 'name'
  | 'phone'
  | 'whatsapp'
  | 'bio'
  | 'skill'
  | 'league'
  | 'courts'
  | 'favourites'
  | 'email'
  | 'availability'
  | null;

// `action` renders left of the Pencil/X and is always visible — it holds the contact-method
// switches, which write a stored preference rather than a draft.
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  label: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  action?: React.ReactNode;
}> = ({ icon, label, editing, onEdit, onCancel, action }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs font-bold text-fg/70 uppercase tracking-widest flex items-center gap-1.5 min-w-0">
      {icon}
      {label}
    </span>
    <div className="flex items-center gap-3 shrink-0">
      {action}
      <button
        type="button"
        onClick={editing ? onCancel : onEdit}
        className={`transition-colors ${editing ? 'text-badge-loss hover:opacity-80' : 'text-fg/70 hover:text-fg'}`}
        aria-label={editing ? 'Cancel' : `Edit ${label}`}
      >
        {editing ? <X className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
      </button>
    </div>
  </div>
);

// Zone picker. Immediate, not a request: the profile card isn't event-scoped, so there is no
// organizer attached to review it. A change NEVER unseats them — matches already generated are
// untouched; the new zone only decides draws not yet made (see functions/zoneMoves.js).
const ZonePickerSheet: React.FC<{
  currentZone: string;
  saving: boolean;
  onClose: () => void;
  onPick: (zone: string) => void;
}> = ({ currentZone, saving, onClose, onPick }) => (
  <Sheet onClose={onClose} title="Your Zone" maxWidthClassName="max-w-md">
    <div className="p-6 pt-3 space-y-4">
      <p className="text-sm text-fg/70">
        Your zone decides which tournament draw you are placed in. Any matches you are already playing stay exactly as
        they are; the new zone applies to draws that haven&apos;t been made yet.
      </p>
      <div className="space-y-2">
        {ZONE_NAMES.map((z) => {
          const isCurrent = z === currentZone;
          return (
            <button
              key={z}
              type="button"
              disabled={isCurrent || saving}
              onClick={() => onPick(z)}
              className={`w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                isCurrent ? 'bg-clay/15 border border-clay/50' : 'bg-fg/5 hover:bg-fg/[0.08] border border-transparent'
              } ${saving ? 'opacity-50' : ''}`}
            >
              <span className="text-sm font-bold text-fg truncate">{z}</span>
              {isCurrent && <span className="text-xs font-bold text-clay-fg shrink-0">Current</span>}
            </button>
          );
        })}
      </div>
    </div>
  </Sheet>
);

// "Contact Method: X" — decides which channels an opponent is offered. Independent of each other;
// disabled when the channel has no detail saved. None on = every channel offered.
const ContactMethodToggle: React.FC<{
  label: string;
  on: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}> = ({ label, on, disabled, onChange }) => (
  <div className="flex items-center gap-2 select-none">
    <span
      className={`text-xs font-bold uppercase tracking-widest text-fg/70 whitespace-nowrap ${disabled ? 'opacity-40' : ''}`}
    >
      Contact Method: {label}
    </span>
    <Switch checked={on} disabled={disabled} label={`Contact Method: ${label}`} onChange={onChange} />
  </div>
);

export const ProfileInfo: React.FC<Props> = ({
  actions,
  updateLoading,
  message,
  emailVerificationSentTo,
  progress,
  counters,
  matches,
  pgWonPct,
}) => {
  const { user: authUser, profile } = useAuth();
  const { items: payments } = usePayments();
  const [editing, setEditing] = useState<Row>(null);
  const [showZoneSheet, setShowZoneSheet] = useState(false);
  const [showDonateSheet, setShowDonateSheet] = useState(false);

  // Court option list + coords (for the court editor + zone recompute), loaded once.
  const { names: runtimeCourtNames, zones: runtimeZones, coords: runtimeCoords } = useCourtResolutions();
  const [courtOptions, setCourtOptions] = useState<string[]>(defaultCourtOptions);
  const [shippedCoords, setShippedCoords] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const courtCoords = useMemo(() => {
    const next = new Map(shippedCoords);
    runtimeCoords.forEach((value, key) => next.set(key, value));
    return next;
  }, [shippedCoords, runtimeCoords]);
  useEffect(() => {
    let alive = true;
    fetch('/Tennis Courts Facilities - 4326.csv')
      .then((r) => (r.ok ? r.text() : ''))
      .then((csv) => {
        if (alive && csv) {
          setCourtOptions(mergeCourtOptions(extractDropdownCourts(csv)));
          setShippedCoords(extractCourtsWithCoords(csv));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Drafts
  const [nameDraft, setNameDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [waDraft, setWaDraft] = useState('');
  const [waSameAsPhone, setWaSameAsPhone] = useState(false);
  const [waValid, setWaValid] = useState(true);
  const [bioDraft, setBioDraft] = useState('');
  const [skillDraft, setSkillDraft] = useState(2);
  const [leagueDraft, setLeagueDraft] = useState<"Men's" | "Women's" | ''>('');
  const [ageCategoryDraft, setAgeCategoryDraft] = useState<'Retired Pro' | 'Juniors' | ''>('');
  const [courtsDraft, setCourtsDraft] = useState<string[]>([]);
  const [courtInput, setCourtInput] = useState('');
  const [courtActiveIndex, setCourtActiveIndex] = useState(0);
  const [favDraft, setFavDraft] = useState<string[]>([]);
  const [favInput, setFavInput] = useState('');
  // Only read once the editor is open — it's a full pass over `preferences`.
  const favOptions = useFavouritePlayerOptions(editing === 'favourites');
  const favSuggestions = getFavouritePlayerSuggestions(favOptions.all, favDraft, favInput);
  // Quick picks: the three names most chosen by men's-league members and the three most chosen
  // by women's-league members. Deduped against each other and against what's already picked, so
  // a name popular in both leagues doesn't take two of the six slots.
  const favQuickPicks = useMemo(
    () => [...new Set([...favOptions.mens, ...favOptions.womens])].filter((p) => !favDraft.includes(p)),
    [favOptions, favDraft],
  );
  const addFavourite = (raw: string) => {
    const name = raw.trim();
    if (!name || favDraft.includes(name)) return;
    setFavDraft([...favDraft, name]);
    setFavInput('');
  };
  const [emailDraft, setEmailDraft] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [availabilityDraft, setAvailabilityDraft] = useState<string[]>([]);

  // Avatar upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    if (!emailVerificationSentTo) return;
    setEmailDraft(emailVerificationSentTo);
    setEmailSent(true);
    setEditing('email');
  }, [emailVerificationSentTo]);

  if (!profile) return null;
  const { user, stats, preferences, contacts } = profile;
  const reauth = emailChangeReauthMethod(authUser?.providerData);

  const open = (row: Row) => {
    setNameDraft(user.name);
    setPhoneDraft(contacts.phone);
    setWaDraft(contacts.whatsapp_contact ?? '');
    setWaSameAsPhone(!!contacts.whatsapp_same_as_phone);
    setWaValid(true);
    setBioDraft(user.bio ?? '');
    setSkillDraft(stats.skill_level);
    setLeagueDraft(leagueDivision(stats.league));
    setAgeCategoryDraft(leagueAgeCategory(stats.league));
    setCourtsDraft(preferences.preferred_courts);
    setFavDraft(preferences.favourite_players);
    setCourtInput('');
    setFavInput('');
    setEmailDraft('');
    setEmailPassword('');
    setEmailSent(false);
    setAvailabilityDraft(preferences.availability_tags ?? []);
    setEditing(row);
  };
  const save = async (fn: () => Promise<boolean>) => {
    if (await fn()) setEditing(null);
  };

  // Which channels the member wants to be reached on. Empty = no preference = all offered.
  const methods = contacts.preferred_mode_of_contact ?? [];
  const toggleMethod = (m: ContactMethod, on: boolean) =>
    actions.updateContactMethods(on ? [...methods, m] : methods.filter((x) => x !== m));
  // A channel with nothing behind it can't be a contact method, so its switch is disabled.
  const hasWhatsapp = !!(
    contacts.whatsapp_contact?.trim() ||
    contacts.whatsapp_same_as_phone ||
    contacts.phone?.trim()
  );
  const methodToggle = (m: ContactMethod, label: string, available: boolean) => (
    <ContactMethodToggle
      label={label}
      on={methods.includes(m)}
      disabled={updateLoading || !available}
      onChange={(on) => toggleMethod(m, on)}
    />
  );

  const pickZone = async (zone: string) => {
    if (await actions.updatePreferredZone(zone)) setShowZoneSheet(false);
  };

  const computeZone = (courts: string[]): string => {
    // A zone chosen by hand wins over the courts. Recomputing here would silently undo the pick
    // and move the member between draws the next time they edit their court list.
    if (preferences.preferred_zone_manual) return preferences.preferred_zone;
    if (courts.length === 0) return '';
    // Majority vote across ALL preferred courts (not just the first one) — a player who splits
    // time across zones should land in whichever zone most of their courts are actually in,
    // with Downtown as the tiebreaker (see zoneFromCourts).
    const zone = zoneFromCourts(courts, courtCoords, runtimeZones);
    return zone || preferences.preferred_zone || '';
  };

  const courtSuggestions = getCourtSuggestions(
    mergeCourtOptions([...courtOptions, ...runtimeCourtNames]),
    courtsDraft,
    courtInput,
  );
  const addCourt = (court: string) => {
    const t = court.trim();
    if (!t || courtsDraft.includes(t)) return;
    setCourtsDraft([...courtsDraft, t]);
    setCourtInput('');
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Avatar images must be 5 MB or smaller.');
      return;
    }
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const path = `avatars/${profile.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      await uploadBytes(ref(storage, path), file, { contentType: file.type });
      const url = await getDownloadURL(ref(storage, path));
      await actions.updateAvatar(url);
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <ProfileCard
        mode="own"
        name={user.name}
        avatar={user.avatar}
        avatarAlt="Avatar"
        onAvatarError={() => setAvatarError('This avatar could not be loaded. Choose a new image.')}
        avatarError={avatarError}
        avatarAction={
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-clay text-fg flex items-center justify-center shadow-lg hover:bg-clay/80 transition-colors"
              aria-label="Upload avatar"
            >
              {avatarUploading ? <Spinner size="sm" tone="current" aria-hidden /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
          </>
        }
        bio={user.bio}
        skillLevel={stats.skill_level}
        league={stats.league}
        displayBadges={user.display_badges}
        courts={preferences.preferred_courts}
        zone={preferences.preferred_zone}
        favourites={preferences.favourite_players}
        availableToPlay={preferences.available_to_play !== false}
        onToggleAvailableToPlay={() => actions.updateAvailableToPlay(preferences.available_to_play === false)}
        availabilityTags={preferences.availability_tags}
        phone={contacts.phone}
        email={contacts.email}
        whatsappContact={contacts.whatsapp_contact}
        whatsappSameAsPhone={contacts.whatsapp_same_as_phone}
        preferred={contacts.preferred_mode_of_contact}
        matches={matches}
        payments={payments}
        pgWonPct={pgWonPct}
        onSupportLeague={() => setShowDonateSheet(true)}
        fieldHeaders={{
          name: (
            <SectionHeader
              icon={null}
              label="Name"
              editing={editing === 'name'}
              onEdit={() => open('name')}
              onCancel={() => setEditing(null)}
            />
          ),
          availability: (
            <SectionHeader
              icon={<Clock className="w-3.5 h-3.5 text-clay-fg" />}
              label="Availability"
              editing={editing === 'availability'}
              onEdit={() => open('availability')}
              onCancel={() => setEditing(null)}
            />
          ),
          contact: (
            <SectionHeader
              icon={null}
              label="Contact"
              editing={editing === 'phone'}
              onEdit={() => open('phone')}
              onCancel={() => setEditing(null)}
              action={methodToggle('text', 'SMS/Text', !!contacts.phone?.trim())}
            />
          ),
          whatsapp: (
            <SectionHeader
              icon={null}
              label="WhatsApp Contact"
              editing={editing === 'whatsapp'}
              onEdit={() => open('whatsapp')}
              onCancel={() => setEditing(null)}
              action={methodToggle('whatsapp', 'WhatsApp', hasWhatsapp)}
            />
          ),
          bio: (
            <SectionHeader
              icon={null}
              label="Bio"
              editing={editing === 'bio'}
              onEdit={() => open('bio')}
              onCancel={() => setEditing(null)}
            />
          ),
          skill: (
            <SectionHeader
              icon={<RacquetIcon className="w-3.5 h-3.5 text-clay-fg" />}
              label="Skill Level"
              editing={editing === 'skill'}
              onEdit={() => open('skill')}
              onCancel={() => setEditing(null)}
            />
          ),
          league: (
            <SectionHeader
              icon={<Users className="w-3.5 h-3.5 text-clay-fg" />}
              label="League"
              editing={editing === 'league'}
              onEdit={() => open('league')}
              onCancel={() => setEditing(null)}
            />
          ),
          courts: (
            <SectionHeader
              icon={<MapPin className="w-3.5 h-3.5 text-clay-fg" />}
              label="Courts"
              editing={editing === 'courts'}
              onEdit={() => open('courts')}
              onCancel={() => setEditing(null)}
            />
          ),
          zone: (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-fg/70 uppercase tracking-widest flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-clay-fg" />
                Zone
              </span>
              <button
                type="button"
                onClick={() => setShowZoneSheet(true)}
                className="text-xs font-semibold text-clay-fg hover:text-clay/80 transition-colors shrink-0"
              >
                Change
              </button>
            </div>
          ),
          favourites: (
            <SectionHeader
              icon={<Star className="w-3.5 h-3.5 text-clay-fg" />}
              label="Favourites"
              editing={editing === 'favourites'}
              onEdit={() => open('favourites')}
              onCancel={() => setEditing(null)}
            />
          ),
        }}
        editors={{
          availability:
            editing === 'availability' ? (
              <div className="mt-2 space-y-2">
                <AvailabilityTagPicker
                  selected={availabilityDraft}
                  onToggle={(id) =>
                    setAvailabilityDraft((prev) =>
                      prev.includes(id) ? prev.filter((tag) => tag !== id) : [...prev, id],
                    )
                  }
                />
                <Button
                  size="sm"
                  onClick={() => save(() => actions.updateAvailabilityTags(availabilityDraft))}
                  isLoading={updateLoading}
                >
                  Save
                </Button>
              </div>
            ) : undefined,
          name:
            editing === 'name' ? (
              <div className="mt-2 flex gap-2">
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
                <Button size="sm" onClick={() => save(() => actions.updateName(nameDraft))} isLoading={updateLoading}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : undefined,
          contact:
            editing === 'phone' ? (
              <div className="mt-2 flex gap-2">
                <Input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(formatPhone(e.target.value))}
                  placeholder="(416)-555-0123"
                />
                <Button size="sm" onClick={() => save(() => actions.updatePhone(phoneDraft))} isLoading={updateLoading}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : undefined,
          whatsapp:
            editing === 'whatsapp' ? (
              <div className="mt-2 space-y-2">
                <Checkbox checked={waSameAsPhone} onChange={setWaSameAsPhone} label="Same as phone number" />
                {!waSameAsPhone && (
                  <IntlTelInput
                    value={waDraft}
                    onChangeNumber={setWaDraft}
                    onChangeValidity={setWaValid}
                    initialCountry="ca"
                    separateDialCode
                    inputProps={{
                      placeholder: 'WhatsApp number',
                      className: field,
                    }}
                  />
                )}
                <Button
                  size="sm"
                  onClick={() => save(() => actions.updateWhatsappContact(waDraft, waSameAsPhone))}
                  isLoading={updateLoading}
                  disabled={!waSameAsPhone && !!waDraft && !waValid}
                >
                  Save
                </Button>
              </div>
            ) : undefined,
          bio:
            editing === 'bio' ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Your tennis vibe: play times, rally or games, and any other details?"
                  className={field}
                />
                <Button size="sm" onClick={() => save(() => actions.updateBio(bioDraft))} isLoading={updateLoading}>
                  Save
                </Button>
              </div>
            ) : undefined,
          skill:
            editing === 'skill' ? (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-7 gap-1.5">
                  {SELECTABLE_SKILL_LEVELS.map((level) => {
                    const active = skillDraft === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSkillDraft(level)}
                        className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-motion ${
                          active
                            ? 'bg-clay/10 text-clay-fg border-clay'
                            : 'bg-fg/5 text-fg border-transparent hover:bg-fg/10'
                        }`}
                      >
                        {level.toFixed(1)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm font-bold text-clay-fg text-center">{skillBand(skillDraft)}</p>
                <Button
                  size="sm"
                  onClick={() => save(() => actions.updateSkills(skillDraft, skillBand(skillDraft)))}
                  isLoading={updateLoading}
                >
                  Save
                </Button>
              </div>
            ) : undefined,
          league:
            editing === 'league' ? (
              <div className="mt-2 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(["Men's", "Women's"] as const).map((leagueOption) => (
                    <button
                      key={leagueOption}
                      type="button"
                      onClick={() => setLeagueDraft(leagueOption)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-motion ${controlChrome(leagueDraft === leagueOption)}`}
                    >
                      {leagueOption}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!leagueDraft}
                    onClick={() => setAgeCategoryDraft(ageCategoryDraft === 'Retired Pro' ? '' : 'Retired Pro')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-motion ${
                      !leagueDraft
                        ? 'bg-fg/5 text-fg/70 opacity-50 cursor-not-allowed'
                        : controlChrome(ageCategoryDraft === 'Retired Pro')
                    }`}
                  >
                    Retired Pro <span className="ml-1 opacity-70 font-normal normal-case">(age: 55+)</span>
                  </button>
                  <button
                    type="button"
                    disabled={!leagueDraft}
                    onClick={() => setAgeCategoryDraft(ageCategoryDraft === 'Juniors' ? '' : 'Juniors')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-motion ${
                      !leagueDraft
                        ? 'bg-fg/5 text-fg/70 opacity-50 cursor-not-allowed'
                        : controlChrome(ageCategoryDraft === 'Juniors')
                    }`}
                  >
                    Juniors
                  </button>
                </div>
                {!leagueDraft && (
                  <p className="text-xs text-fg/70">
                    Choose Men&apos;s or Women&apos;s above first. Then you can pick Retired Pro or Juniors.
                  </p>
                )}
                <Button
                  size="sm"
                  onClick={() => save(() => actions.updateLeagueAgeCategory(leagueDraft, ageCategoryDraft))}
                  isLoading={updateLoading}
                >
                  Save
                </Button>
              </div>
            ) : undefined,
          courts:
            editing === 'courts' ? (
              <div className="mt-2 space-y-2">
                {courtsDraft.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {courtsDraft.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCourtsDraft(courtsDraft.filter((x) => x !== c))}
                        aria-label={`Remove ${c}`}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-clay text-fg flex items-center gap-1.5 focus-visible"
                      >
                        {c}{' '}
                        <span className="opacity-70" aria-hidden="true">
                          ✕
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    aria-label="Search courts"
                    role="combobox"
                    aria-expanded={courtSuggestions.length > 0}
                    aria-controls="profile-court-list"
                    aria-autocomplete="list"
                    placeholder="Search courts…"
                    value={courtInput}
                    onChange={(e) => {
                      setCourtInput(e.target.value);
                      setCourtActiveIndex(0);
                    }}
                    onKeyDown={(e) => {
                      const open = courtSuggestions.length > 0;
                      const action = listboxKeyAction(e.key, courtSuggestions.length, courtActiveIndex, open);
                      if (action) {
                        e.preventDefault();
                        if (action.type === 'open' || action.type === 'move') setCourtActiveIndex(action.index);
                        else if (action.type === 'select') {
                          const court = courtSuggestions[action.index];
                          if (court) addCourt(court);
                        } else if (action.type === 'close') setCourtInput('');
                        return;
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCourt(courtInput);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="clay"
                    className="px-3 shrink-0"
                    onClick={() => addCourt(courtInput)}
                    disabled={!courtInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                <Popover
                  id="profile-court-list"
                  open={courtSuggestions.length > 0}
                  onClose={() => setCourtInput('')}
                  aria-label="Court choices"
                  className="relative top-auto mt-0 max-h-40"
                >
                  {courtSuggestions.map((c, index) => (
                    <PopoverRow
                      key={c}
                      aria-selected={index === courtActiveIndex}
                      className={index === courtActiveIndex ? 'bg-clay/20' : undefined}
                      onClick={() => addCourt(c)}
                    >
                      {c}
                    </PopoverRow>
                  ))}
                </Popover>
                <Button
                  size="sm"
                  onClick={() => save(() => actions.updatePreferredCourts(courtsDraft, computeZone(courtsDraft)))}
                  isLoading={updateLoading}
                >
                  Save
                </Button>
              </div>
            ) : undefined,
          favourites:
            editing === 'favourites' ? (
              <div className="mt-2 space-y-2">
                {favDraft.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {favDraft.map((p) => (
                      <PersonChip
                        key={p}
                        name={p}
                        onRemove={() => setFavDraft(favDraft.filter((x) => x !== p))}
                        removeLabel={`Remove ${p}`}
                        className="bg-clay"
                      />
                    ))}
                  </div>
                )}
                {favQuickPicks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {favQuickPicks.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => addFavourite(p)}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-fg/5 text-fg hover:bg-clay/20 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
                <Input
                  placeholder="Search or add a player…"
                  value={favInput}
                  onChange={(e) => setFavInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFavourite(favInput);
                    }
                  }}
                />
                {favSuggestions.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-2xl bg-tennis-dark/60 p-1">
                    {favSuggestions.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => addFavourite(p)}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-fg hover:bg-clay/20 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
                {!!favInput.trim() && !favSuggestions.includes(favInput.trim()) && (
                  <button
                    type="button"
                    onClick={() => addFavourite(favInput)}
                    className="text-xs font-bold text-clay-fg hover:underline"
                  >
                    Add “{favInput.trim()}”
                  </button>
                )}
                <Button
                  size="sm"
                  onClick={() => save(() => actions.updateFavouritePlayers(favDraft))}
                  isLoading={updateLoading}
                >
                  Save
                </Button>
              </div>
            ) : undefined,
        }}
        badgesExtra={
          <BadgePicker
            selected={user.display_badges ?? []}
            onSave={actions.updateDisplayBadges}
            saving={updateLoading}
            progress={progress}
            counters={counters}
          />
        }
        extra={
          <>
            <div className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-fg/70">Email Notifications</p>
                <p className="text-xs text-fg/70 mt-0.5">
                  Challenge/rally updates and your weekly incomplete-matches reminder.
                </p>
              </div>
              <Switch
                checked={preferences.email_notifications !== false}
                disabled={updateLoading}
                label="Email Notifications"
                onChange={(enabled) => actions.updateEmailNotifications(enabled)}
              />
            </div>
            <div className="pt-4 mt-1 border-t border-fg/5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold text-fg/70 uppercase tracking-widest">Email</span>
                {methodToggle('email', 'Email', !!contacts.email?.trim())}
              </div>
              <p className="text-sm text-fg mb-2 break-all">{contacts.email || '—'}</p>
              {editing === 'email' ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-fg/70 uppercase tracking-widest">Change Email Address</p>
                  {reauth.type === 'unsupported' ? (
                    <p className="text-sm text-fg/70">{EMAIL_CHANGE_UNSUPPORTED_MESSAGE}</p>
                  ) : emailSent ? (
                    <div className="space-y-2">
                      <p className="text-sm text-fg/70">
                        Verification sent to <span className="text-fg">{emailDraft}</span>. Confirm it, then refresh.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => actions.refreshEmailChange()}>
                          Refresh
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            actions.dismissEmailChange();
                            setEditing(null);
                          }}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="email"
                        placeholder="New email address"
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                      />
                      {reauth.type === 'password' ? (
                        <Input
                          type="password"
                          placeholder="Current password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                        />
                      ) : null}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (
                              await actions.changeEmail(
                                emailDraft,
                                reauth.type === 'password' ? emailPassword : undefined,
                              )
                            ) {
                              setEmailSent(true);
                            }
                          }}
                          isLoading={updateLoading}
                        >
                          {reauth.type === 'oauth' ? (
                            <>
                              {reauth.providerId === 'google.com' ? (
                                <Chrome className="mr-2 w-4 h-4" />
                              ) : (
                                <Apple className="mr-2 w-4 h-4" />
                              )}
                              Continue with {OAUTH_PROVIDER_LABEL[reauth.providerId]}
                            </>
                          ) : (
                            'Send verification'
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => open('email')}
                  className="text-xs font-semibold text-clay-fg hover:text-clay/80 transition-colors"
                >
                  Change email address
                </button>
              )}
            </div>
            {message?.text && (
              <AlertMessage tone={message.type} className="mt-3">
                {message.text}
              </AlertMessage>
            )}
          </>
        }
      />
      <AnimatePresence>
        {showZoneSheet && (
          <ZonePickerSheet
            currentZone={preferences.preferred_zone}
            saving={updateLoading}
            onClose={() => setShowZoneSheet(false)}
            onPick={pickZone}
          />
        )}
        {showDonateSheet && <DonationSurface onClose={() => setShowDonateSheet(false)} />}
      </AnimatePresence>
    </>
  );
};
