import { HttpsError } from 'firebase-functions/v2/https';

type AuthRequest = {
  auth?: { uid?: string | undefined } | null | undefined;
};

type TrimOptions = {
  maxLength?: number | undefined;
};

function requireAuth(request: AuthRequest): string {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to continue.');
  return uid;
}

function requireTrimmedString(value: unknown, message: string, options: TrimOptions = {}): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', message);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new HttpsError('invalid-argument', message);
  }
  if (typeof options.maxLength === 'number' && trimmed.length > options.maxLength) {
    throw new HttpsError('invalid-argument', message);
  }

  return trimmed;
}

function optionalTrimmedString(value: unknown, options: TrimOptions = {}): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (typeof options.maxLength === 'number' && trimmed.length > options.maxLength) {
    throw new HttpsError('invalid-argument', 'Text is too long.');
  }
  return trimmed;
}

function normalizeCouponCode(value: unknown): string {
  return requireTrimmedString(value, 'Missing coupon code.').toUpperCase();
}

export { normalizeCouponCode, optionalTrimmedString, requireAuth, requireTrimmedString };
