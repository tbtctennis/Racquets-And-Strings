export const DEFAULT_AUTH_REDIRECT = '/profile';

const AUTH_REDIRECT_ORIGIN = 'https://rands.local';

/**
 * Keep auth return paths inside the app. The value is deliberately a path, not a URL, so a
 * query-string supplied by an untrusted link cannot send a successful sign-in off-site.
 */
export function getSafeAuthRedirect(next: string | null | undefined): string {
  const candidate = next?.trim() ?? '';
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const parsed = new URL(candidate, AUTH_REDIRECT_ORIGIN);
    if (
      parsed.origin !== AUTH_REDIRECT_ORIGIN ||
      parsed.pathname.startsWith('//') ||
      parsed.pathname.includes('\\') ||
      parsed.pathname === '/login' ||
      parsed.pathname === '/signup'
    ) {
      return DEFAULT_AUTH_REDIRECT;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

/** Build the login route while retaining a validated in-app destination. */
export function getLoginPath(next: string | null | undefined): string {
  const destination = getSafeAuthRedirect(next);
  return destination === DEFAULT_AUTH_REDIRECT ? '/login' : `/login?next=${encodeURIComponent(destination)}`;
}
