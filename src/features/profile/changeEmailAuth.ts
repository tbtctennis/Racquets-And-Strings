import { EMAIL_REGEX } from '../../utils/emailRegex';

export const EMAIL_CHANGE_PENDING_KEY = 'rs-pending-email-change';

export const EMAIL_CHANGE_VERIFY_MESSAGE =
  'Verification email sent to your new address. Please confirm it, then click refresh below.';

export const EMAIL_CHANGE_UNSUPPORTED_MESSAGE =
  'Email changes from this sign-in method are not supported. Sign out and sign in with Google or Apple, then try again.';

export const OAUTH_PROVIDER_LABEL = {
  'google.com': 'Google',
  'apple.com': 'Apple',
} as const;

export type SupportedOAuthProviderId = keyof typeof OAUTH_PROVIDER_LABEL;

export type EmailChangeReauthMethod =
  | { type: 'password' }
  | { type: 'oauth'; providerId: SupportedOAuthProviderId }
  | { type: 'unsupported'; providerIds: string[] };

export type PendingEmailChange = {
  email: string;
  phase: 'reauth' | 'verify';
};

export type EmailChangeUser = {
  email?: string | null;
  providerData?: ReadonlyArray<{ providerId: string }> | null;
};

export type EmailChangeAdapters = {
  reauthenticateWithPassword: (user: EmailChangeUser, password: string) => Promise<void>;
  reauthenticateWithPopup: (user: EmailChangeUser, providerId: SupportedOAuthProviderId) => Promise<void>;
  reauthenticateWithRedirect: (user: EmailChangeUser, providerId: SupportedOAuthProviderId) => Promise<void>;
  verifyBeforeUpdateEmail: (user: EmailChangeUser, email: string) => Promise<void>;
  getRedirectResult: () => Promise<{ user?: EmailChangeUser } | null>;
  readPending: () => PendingEmailChange | null;
  writePending: (pending: PendingEmailChange) => void;
  clearPending: () => void;
};

export function emailChangeError(code: string, message: string): Error {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

export function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error ?? '').toLowerCase();
  const record = error as { code?: unknown; message?: unknown };
  return String(record.code || record.message || '').toLowerCase();
}

export function isOAuthPopupFallbackError(error: unknown): boolean {
  const code = errorCode(error);
  return (
    code.includes('popup-blocked') || code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')
  );
}

export function emailChangeReauthMethod(
  providerData: ReadonlyArray<{ providerId: string }> | null | undefined,
): EmailChangeReauthMethod {
  const ids = (providerData ?? []).map((entry) => entry.providerId).filter(Boolean);
  // Empty providerData is treated as password so a still-loading Auth user keeps the existing form.
  if (ids.length === 0 || ids.includes('password')) return { type: 'password' };
  const oauthId = ids.find((id): id is SupportedOAuthProviderId => id === 'google.com' || id === 'apple.com');
  if (oauthId) return { type: 'oauth', providerId: oauthId };
  return { type: 'unsupported', providerIds: ids };
}

export function normalizeNewEmail(newEmail: string, currentEmail?: string | null): string {
  const trimmed = newEmail.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    throw emailChangeError('auth/invalid-email', 'Please enter a valid email address.');
  }
  if (currentEmail && trimmed.toLowerCase() === currentEmail.trim().toLowerCase()) {
    throw emailChangeError('auth/email-already-current', 'That is already your current email.');
  }
  return trimmed;
}

export function emailChangeErrorMessage(error: unknown, method: EmailChangeReauthMethod): string {
  const code = errorCode(error);
  const label = method.type === 'oauth' ? OAUTH_PROVIDER_LABEL[method.providerId] : 'Google or Apple';

  if (code.includes('unsupported-provider')) return EMAIL_CHANGE_UNSUPPORTED_MESSAGE;
  if (code.includes('missing-password')) return 'Enter your current password to continue.';
  if (code.includes('email-already-current')) return 'That is already your current email.';
  if (code.includes('invalid-email')) return 'Please enter a valid email address.';
  if (code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('invalid-password')) {
    return 'Incorrect password. Please try again.';
  }
  if (code.includes('requires-recent-login')) return 'Please sign out and sign in again to continue.';
  if (code.includes('email-already-in-use')) return 'That email is already registered.';
  if (code.includes('user-mismatch')) {
    return `The ${label} account you selected does not match this profile. Use the account you originally signed in with.`;
  }
  if (code.includes('credential-already-in-use')) {
    return `That ${label} account is already used by a different profile.`;
  }
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
    return `${label} confirmation was cancelled.`;
  }
  if (code.includes('popup-blocked')) {
    return 'Please allow pop-ups, or sign out and sign in again, then retry the email change.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'This sign-in method is not available right now. Please try again later.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
  return 'Unable to change your email. Please try again.';
}

export function parsePendingEmailChange(raw: string | null): PendingEmailChange | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { email?: unknown; phase?: unknown };
    if (typeof parsed?.email !== 'string' || !parsed.email.trim()) return null;
    if (parsed.phase !== 'reauth' && parsed.phase !== 'verify') return null;
    return { email: parsed.email.trim(), phase: parsed.phase };
  } catch {
    return null;
  }
}

export function readPendingEmailChange(): PendingEmailChange | null {
  try {
    return parsePendingEmailChange(sessionStorage.getItem(EMAIL_CHANGE_PENDING_KEY));
  } catch {
    return null;
  }
}

export function writePendingEmailChange(pending: PendingEmailChange) {
  try {
    sessionStorage.setItem(EMAIL_CHANGE_PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* private mode */
  }
}

export function clearPendingEmailChange() {
  try {
    sessionStorage.removeItem(EMAIL_CHANGE_PENDING_KEY);
  } catch {
    /* private mode */
  }
}

export async function runChangeEmail(
  user: EmailChangeUser,
  newEmail: string,
  password: string | undefined,
  adapters: EmailChangeAdapters,
): Promise<'verification-sent' | 'redirect'> {
  const trimmed = normalizeNewEmail(newEmail, user.email);
  const method = emailChangeReauthMethod(user.providerData);

  if (method.type === 'unsupported') {
    throw emailChangeError('auth/unsupported-provider', EMAIL_CHANGE_UNSUPPORTED_MESSAGE);
  }

  if (method.type === 'password') {
    if (!password?.trim()) {
      throw emailChangeError('auth/missing-password', 'Enter your current password to continue.');
    }
    await adapters.reauthenticateWithPassword(user, password);
  } else {
    try {
      await adapters.reauthenticateWithPopup(user, method.providerId);
    } catch (error) {
      if (!isOAuthPopupFallbackError(error)) throw error;
      adapters.writePending({ email: trimmed, phase: 'reauth' });
      try {
        await adapters.reauthenticateWithRedirect(user, method.providerId);
        return 'redirect';
      } catch (redirectError) {
        adapters.clearPending();
        throw redirectError;
      }
    }
  }

  await adapters.verifyBeforeUpdateEmail(user, trimmed);
  adapters.writePending({ email: trimmed, phase: 'verify' });
  return 'verification-sent';
}

export async function runCompletePendingEmailChange(
  user: EmailChangeUser,
  adapters: EmailChangeAdapters,
): Promise<'verification-sent' | 'skipped'> {
  const pending = adapters.readPending();
  if (!pending || pending.phase !== 'reauth') return 'skipped';
  try {
    const result = await adapters.getRedirectResult();
    if (!result) return 'skipped';
    await adapters.verifyBeforeUpdateEmail(result.user ?? user, pending.email);
    adapters.writePending({ email: pending.email, phase: 'verify' });
    return 'verification-sent';
  } catch (error) {
    adapters.clearPending();
    throw error;
  }
}
