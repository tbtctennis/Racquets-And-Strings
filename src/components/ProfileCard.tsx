import React from 'react';
import { Award, Clock, MapPin, Star, Users } from 'lucide-react';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { FieldError } from './FieldError';
import { RacquetIcon } from './RacquetIcon';
import { StatGrid } from './StatGrid';
import { StatTile } from './StatTile';
import { contactChannels, pillButtonCls } from './ContactOpponentButton';
import { BadgeRow } from '../features/tasks/BadgeRow';
import { BADGE_PILL_CLASS } from '../features/tasks/badges';
import {
  CONTRIBUTOR_BADGE_NAME,
  hasContributorBadge,
  type ContributorBadgePayment,
} from '../features/payments/paymentDocument';
import { skillBand } from '../features/tournament/domain/placement';
import { leagueAgeCategory, leagueDivision } from '../utils/skillLevels';
import { formatPersonName } from '../utils/nameFormatting';
import { availabilityTagLabel, collapseAvailabilityTags } from '../utils/availability';
import { cn } from '../lib/cn';
import type { ContactMethod } from '../types';

export type ProfileCardMode = 'own' | 'public';

export type ProfileCardField =
  | 'name'
  | 'availability'
  | 'contact'
  | 'whatsapp'
  | 'bio'
  | 'skill'
  | 'league'
  | 'badges'
  | 'courts'
  | 'zone'
  | 'favourites';

export type ProfileCardMatch = { won: boolean };

export type ProfileCardProps = {
  mode: ProfileCardMode;
  name?: string | undefined;
  avatar?: string | undefined;
  avatarAlt?: string | undefined;
  onAvatarError?: (() => void) | undefined;
  avatarAction?: React.ReactNode | undefined;
  avatarError?: string | undefined;
  bio?: string | undefined;
  skillLevel?: number | undefined;
  league?: string | undefined;
  displayBadges?: string[] | undefined;
  courts?: string[] | undefined;
  zone?: string | undefined;
  favourites?: string[] | undefined;
  availableToPlay?: boolean | undefined;
  onToggleAvailableToPlay?: (() => void) | undefined;
  availabilityTags?: string[] | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  whatsappContact?: string | undefined;
  whatsappSameAsPhone?: boolean | undefined;
  preferred?: ContactMethod[] | undefined;
  /** Completed matches, newest first. Streak is derived here so the pages do not recompute it. */
  matches?: ProfileCardMatch[] | undefined;
  /**
   * Payment records the viewer was allowed to read. The Contributor badge is derived here from
   * succeeded donations — never a stored flag. Refunded rows drop out; a pending request does not.
   */
  payments?: ContributorBadgePayment[] | undefined;
  /** Preformatted P/G won % from the shared `pgWinPct` helper. */
  pgWonPct?: string | undefined;
  fieldHeaders?: Partial<Record<ProfileCardField, React.ReactNode>> | undefined;
  editors?: Partial<Record<ProfileCardField, React.ReactNode>> | undefined;
  badgesExtra?: React.ReactNode | undefined;
  extra?: React.ReactNode | undefined;
  /** Own-card donate CTA. Public mode never shows it. */
  onSupportLeague?: (() => void) | undefined;
  className?: string | undefined;
};

const OWN_FIELDS: ProfileCardField[] = [
  'name',
  'availability',
  'contact',
  'whatsapp',
  'bio',
  'skill',
  'league',
  'badges',
  'courts',
  'zone',
  'favourites',
];

const PUBLIC_FIELDS: ProfileCardField[] = [
  'name',
  'contact',
  'bio',
  'skill',
  'badges',
  'league',
  'courts',
  'favourites',
];

const CONTACT_UNLOCK =
  'Contact details show once you have an accepted challenge or rally with this player, or you are drawn against each other.';

const SectionLabel: React.FC<{ icon?: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span className="text-xs font-bold text-fg/70 uppercase tracking-widest flex items-center gap-1.5">
    {icon}
    {label}
  </span>
);

const Pill: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-fg/5 text-fg/70">{label}</span>
);

const PillList: React.FC<{ values: string[]; empty: string }> = ({ values, empty }) => (
  <div className="mt-1 flex flex-wrap gap-1.5">
    {values.length > 0 ? (
      values.map((value) => <Pill key={value} label={value} />)
    ) : (
      <span className="text-sm text-fg/70">{empty}</span>
    )}
  </div>
);

/** Consecutive W/L from newest completed matches. Lives on the card so other surfaces reuse it. */
export const streakFromMatches = (matches: ProfileCardMatch[]): string => {
  const first = matches[0];
  if (!first) return '—';
  const firstWon = first.won;
  let n = 0;
  for (const match of matches) {
    if (match.won !== firstWon) break;
    n += 1;
  }
  return `${n}${firstWon ? 'W' : 'L'}`;
};

const displayNameOf = (name?: string): string => ((name ?? '').trim() ? formatPersonName(name) : '—');

/**
 * Shared profile card. Own mode is the member's card; public mode is another player's.
 * Contact visibility is gated by Firestore rules — pass only fields the viewer was allowed to read.
 */
export const ProfileCard: React.FC<ProfileCardProps> = ({
  mode,
  name,
  avatar,
  avatarAlt,
  onAvatarError,
  avatarAction,
  avatarError,
  bio,
  skillLevel,
  league,
  displayBadges,
  courts = [],
  zone,
  favourites = [],
  availableToPlay = true,
  onToggleAvailableToPlay,
  availabilityTags = [],
  phone,
  email,
  whatsappContact,
  whatsappSameAsPhone,
  preferred,
  matches = [],
  payments = [],
  pgWonPct = '—',
  fieldHeaders,
  editors,
  badgesExtra,
  extra,
  onSupportLeague,
  className,
}) => {
  const displayName = displayNameOf(name);
  const channels = contactChannels({ phone, email, whatsappContact, preferred });
  const division = leagueDivision(league);
  const ageCategory = leagueAgeCategory(league);
  const fields = mode === 'own' ? OWN_FIELDS : PUBLIC_FIELDS;

  const header = (field: ProfileCardField, icon: React.ReactNode, label: string) =>
    fieldHeaders?.[field] ?? <SectionLabel icon={icon} label={label} />;

  const body = (field: ProfileCardField, fallback: React.ReactNode) => editors?.[field] ?? fallback;

  const contactValue =
    mode === 'public' ? (
      channels.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {channels.map((channel) => (
            <a
              key={channel.key}
              href={channel.href}
              target={channel.key === 'whatsapp' ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={pillButtonCls('md', 'clay')}
            >
              <channel.icon className="w-3.5 h-3.5" />
              {channel.label}
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-fg/70 mt-0.5">{CONTACT_UNLOCK}</p>
      )
    ) : (
      <p className="text-lg font-bold text-fg mt-0.5">{phone || '—'}</p>
    );

  const fieldBody: Record<ProfileCardField, React.ReactNode> = {
    name: <p className="text-lg font-bold text-fg mt-0.5 break-words">{displayName}</p>,
    availability: (
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-fg/70 uppercase tracking-widest">Available to play</span>
          <p className="text-xs text-fg/60 mt-1">Turn this off to show an Away pill to other players.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={availableToPlay}
          onClick={onToggleAvailableToPlay}
          className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold transition-colors ${
            availableToPlay ? 'bg-clay/20 text-clay-fg' : 'bg-fg/10 text-fg/60'
          }`}
        >
          {availableToPlay ? 'Available' : 'Away'}
        </button>
      </div>
    ),
    contact: contactValue,
    whatsapp: (
      <p className="text-lg font-bold text-fg mt-0.5">
        {whatsappSameAsPhone ? 'Same as phone number' : whatsappContact || '—'}
      </p>
    ),
    bio: <p className="text-sm text-fg/70 mt-0.5">{bio?.trim() || <span className="text-fg/70">No bio yet.</span>}</p>,
    skill:
      skillLevel != null ? (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-bold text-fg">NTRP {skillLevel}</span>
        </div>
      ) : (
        <p className="text-sm text-fg/70 mt-1">Not set.</p>
      ),
    league: (
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {division && <Pill label={`${division} League`} />}
        {ageCategory && <Pill label={ageCategory} />}
        {!division && <span className="text-sm text-fg/70">Not set.</span>}
      </div>
    ),
    badges: (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {skillLevel != null && <span className={BADGE_PILL_CLASS}>{skillBand(skillLevel)}</span>}
        <BadgeRow ids={displayBadges} />
        {hasContributorBadge(payments) && (
          <span title="An unrefunded donation" className={BADGE_PILL_CLASS}>
            {CONTRIBUTOR_BADGE_NAME}
          </span>
        )}
        {badgesExtra}
      </div>
    ),
    courts: <PillList values={courts} empty="None set." />,
    zone: <PillList values={zone ? [zone] : []} empty="None set." />,
    favourites: <PillList values={favourites} empty="None set." />,
  };

  const fieldHeader: Record<ProfileCardField, React.ReactNode> = {
    name: header('name', null, 'Name'),
    availability: header('availability', <Clock className="w-3.5 h-3.5 text-clay-fg" />, 'Availability'),
    contact: header('contact', null, 'Contact'),
    whatsapp: header('whatsapp', null, 'WhatsApp Contact'),
    bio: header('bio', null, 'Bio'),
    skill: header('skill', <RacquetIcon className="w-3.5 h-3.5 text-clay-fg" />, 'Skill Level'),
    league: header('league', <Users className="w-3.5 h-3.5 text-clay-fg" />, 'League'),
    badges: header('badges', <Award className="w-3.5 h-3.5 text-clay-fg" />, 'Badges'),
    courts: header('courts', <MapPin className="w-3.5 h-3.5 text-clay-fg" />, 'Courts'),
    zone: header('zone', <MapPin className="w-3.5 h-3.5 text-clay-fg" />, 'Zone'),
    favourites: header('favourites', <Star className="w-3.5 h-3.5 text-clay-fg" />, 'Favourites'),
  };

  return (
    <article
      data-mode={mode}
      className={cn('w-full rounded-3xl bg-tennis-surface/30 p-5 card-shadow sm:p-7', className)}
    >
      <h2 className="text-xl font-bold text-fg mb-5">Profile Card</h2>

      <div className="flex flex-col items-center gap-4 pb-5 border-b border-fg/5">
        <div className="relative">
          <div className="rounded-full bg-tennis-surface flex items-center justify-center overflow-hidden">
            <Avatar
              src={avatar}
              name={name || email || '?'}
              size="profile"
              alt={avatarAlt ?? name}
              className="bg-transparent text-fg"
              onError={onAvatarError}
            />
          </div>
          {avatarAction}
        </div>
        {avatarError && <FieldError>{avatarError}</FieldError>}
      </div>

      <div className="divide-y divide-fg/10">
        {fields.map((field) => {
          if (field === 'league' && mode === 'public' && !division) return null;
          if (field === 'availability') {
            const tagLabels = collapseAvailabilityTags(availabilityTags).map(availabilityTagLabel);
            return (
              <div key={field} className="py-3">
                {fieldHeader[field]}
                {fieldBody.availability}
                {editors?.availability ?? <PillList values={tagLabels} empty="None set." />}
              </div>
            );
          }
          return (
            <div key={field} className="py-3">
              {fieldHeader[field]}
              {body(field, fieldBody[field])}
            </div>
          );
        })}
      </div>

      {mode === 'own' ? (
        <div className="pt-4 space-y-4">
          <Button type="button" className="w-full" onClick={onSupportLeague}>
            Support the league
          </Button>
          {extra}
        </div>
      ) : null}

      <StatGrid className="mt-5 gap-3">
        <StatTile label="Streak" value={streakFromMatches(matches)} />
        <StatTile label="P/G Won %" value={pgWonPct} />
      </StatGrid>
    </article>
  );
};
