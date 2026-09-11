import React from 'react';
import { hasPublicHours, type CourtWithCount } from '../pages/courtmap/courtMapUtils';

export type PlaceCardDensity = 'default' | 'compact';

export type PlaceCardProps = {
  court: CourtWithCount;
  density?: PlaceCardDensity | undefined;
  onViewPrograms?: (() => void) | undefined;
  onSuggest?: (() => void) | undefined;
};

const badgeClass = 'inline-flex items-center rounded-xl px-1.5 py-0.5 text-xs font-semibold leading-tight';

const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({ children, className }) => (
  <span className={`${badgeClass} ${className}`}>{children}</span>
);

const LinkButton: React.FC<{ href: string; children: React.ReactNode; className: string }> = ({
  href,
  children,
  className,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={`inline-flex min-h-11 items-center rounded-2xl px-2.5 text-xs font-medium text-white no-underline ${className}`}
  >
    {children}
  </a>
);

/** Shared court/place summary. Compact density is used inside the court-map popup. */
export const PlaceCard: React.FC<PlaceCardProps> = ({ court, density = 'default', onViewPrograms, onSuggest }) => {
  const compact = density === 'compact';
  const title = court.dropdown || court.name;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${court.lat},${court.lng}`;

  return (
    <article className={`font-sans text-center ${compact ? 'p-1' : 'rounded-2xl bg-tennis-surface p-4'}`}>
      <h3 className={`${compact ? 'mb-1 text-sm' : 'mb-1.5 text-base'} font-bold text-fg`}>{title}</h3>
      {court.address && <p className="mb-2 text-xs text-fg/65">{court.address}</p>}

      <div className="mb-2 flex flex-wrap justify-center gap-1">
        <Badge className="bg-fg/10 text-fg">{court.courtType.toUpperCase()}</Badge>
        {court.numCourts > 0 && <Badge className="bg-fg/10 text-fg">{court.numCourts} CT</Badge>}
        {court.lights && <Badge className="bg-yellow-200 text-yellow-900">LIGHTS</Badge>}
        {hasPublicHours(court) && <Badge className="bg-blue-900 text-blue-200">OPEN HOURS</Badge>}
        {court.bookingUrl && <Badge className="bg-orange-900 text-orange-200">BOOKABLE</Badge>}
        {court.pickleballEntries.map((entry, index) => {
          const suffix =
            entry.netType === 'No Net'
              ? ' · BRING OWN NET'
              : entry.netType === 'Tennis'
                ? ' · USE TENNIS COURTS'
                : entry.netType === 'Adjustable'
                  ? ' · ADJUSTABLE NET'
                  : '';
          return (
            <Badge key={`${entry.netType}-${index}`} className="bg-orange-950 text-orange-300">
              PICKLEBALL {entry.numCourts} CT{suffix}
            </Badge>
          );
        })}
      </div>

      {court.count > 0 && (
        <p className="mb-1 text-xs text-green-600">
          {court.count} player{court.count !== 1 ? 's' : ''}
        </p>
      )}
      {court.clubInfo && <p className="mb-1.5 text-xs leading-[1.4] text-fg/65">{court.clubInfo}</p>}

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <LinkButton href={directionsUrl} className="bg-green-800">
          Directions
        </LinkButton>
        {court.website && (
          <LinkButton href={court.website} className="bg-blue-700">
            Website
          </LinkButton>
        )}
        {court.bookingUrl && (
          <LinkButton href={court.bookingUrl} className="bg-green-800">
            Book Online
          </LinkButton>
        )}
        {court.hasPrograms && onViewPrograms && (
          <button
            type="button"
            onClick={onViewPrograms}
            className="inline-flex min-h-11 items-center rounded-2xl bg-yellow-600 px-2.5 text-xs font-medium text-white"
          >
            View Available Programs
          </button>
        )}
      </div>

      {onSuggest && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={onSuggest}
            className="inline-flex min-h-11 items-center rounded-2xl bg-orange-600 px-3 text-xs font-semibold text-white"
          >
            Report
          </button>
        </div>
      )}
    </article>
  );
};
