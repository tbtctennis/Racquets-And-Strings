const BRACKET_PLACEHOLDER = /^(?:player[_ ]loading|bye)$/i;
const WINNER_PLACEHOLDER = /^winner of\s+/i;
/** First names longer than this drop the surname initial so a 360px row still identifies them. */
const COMPACT_FIRST_NAME_MAX = 7;

const isPlaceholderName = (trimmed: string): boolean =>
  BRACKET_PLACEHOLDER.test(trimmed) || WINNER_PLACEHOLDER.test(trimmed);

/**
 * Format a person's display name while leaving bracket placeholders readable.
 *
 * The fallback is intentionally returned unchanged to preserve callers' existing
 * display labels when the source name is empty.
 */
export const formatPersonName = (name?: string, fallback = 'Player'): string => {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return fallback;
  if (isPlaceholderName(trimmed)) return trimmed;

  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

/**
 * Row-safe name: whole first name plus surname initial (`Annas T`), never `Ann...`.
 * A first name too long for a 360px row is cut to 7 characters with no initial.
 */
export const compactPersonName = (name?: string, fallback = 'Player'): string => {
  const formatted = formatPersonName(name, fallback);
  const trimmed = (name ?? '').trim();
  if (trimmed && isPlaceholderName(trimmed)) return formatted;

  const parts = formatted.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? formatted;
  if (first.length > COMPACT_FIRST_NAME_MAX) return first.slice(0, COMPACT_FIRST_NAME_MAX);
  if (parts.length < 2) return first;
  const initial = parts[parts.length - 1]?.charAt(0);
  return initial ? `${first} ${initial}` : first;
};

/** Return the canonical display initial for a person or placeholder. */
export const initialOf = (name?: string, fallback = 'Player'): string =>
  formatPersonName(name, fallback).slice(0, 1).toUpperCase();
