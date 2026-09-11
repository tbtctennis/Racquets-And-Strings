import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  EMAIL_CHANGE_UNSUPPORTED_MESSAGE,
  EMAIL_CHANGE_VERIFY_MESSAGE,
  emailChangeError,
  emailChangeErrorMessage,
  emailChangeReauthMethod,
  normalizeNewEmail,
  parsePendingEmailChange,
  runChangeEmail,
  runCompletePendingEmailChange,
} from '../../src/features/profile/changeEmailAuth.ts';

const src = (relative) => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

const user = (providers, email = 'old@example.com') => ({
  email,
  providerData: providers.map((providerId) => ({ providerId })),
});

const recordingAdapters = (overrides = {}) => {
  const calls = [];
  const adapters = {
    reauthenticateWithPassword: async (_user, password) => {
      calls.push(['password', password]);
    },
    reauthenticateWithPopup: async (_user, providerId) => {
      calls.push(['popup', providerId]);
    },
    reauthenticateWithRedirect: async (_user, providerId) => {
      calls.push(['redirect', providerId]);
    },
    verifyBeforeUpdateEmail: async (_user, email) => {
      calls.push(['verify', email]);
    },
    getRedirectResult: async () => {
      calls.push(['redirect-result']);
      return null;
    },
    readPending: () => null,
    writePending: (pending) => {
      calls.push(['write', pending]);
    },
    clearPending: () => {
      calls.push(['clear']);
    },
    ...overrides,
  };
  return { adapters, calls };
};

test('password accounts keep password reauth even when Google is also linked', () => {
  assert.deepEqual(emailChangeReauthMethod([{ providerId: 'password' }, { providerId: 'google.com' }]), {
    type: 'password',
  });
  assert.deepEqual(emailChangeReauthMethod([]), { type: 'password' });
});

test('OAuth-only Google and Apple accounts reauthenticate with the linked provider', () => {
  assert.deepEqual(emailChangeReauthMethod([{ providerId: 'google.com' }]), {
    type: 'oauth',
    providerId: 'google.com',
  });
  assert.deepEqual(emailChangeReauthMethod([{ providerId: 'apple.com' }]), {
    type: 'oauth',
    providerId: 'apple.com',
  });
  assert.deepEqual(emailChangeReauthMethod([{ providerId: 'apple.com' }, { providerId: 'google.com' }]), {
    type: 'oauth',
    providerId: 'apple.com',
  });
});

test('unsupported providers are rejected instead of asking for a password', () => {
  assert.deepEqual(emailChangeReauthMethod([{ providerId: 'facebook.com' }]), {
    type: 'unsupported',
    providerIds: ['facebook.com'],
  });
});

test('new email is trimmed, validated, and rejected when unchanged', () => {
  assert.equal(normalizeNewEmail('  new@example.com  ', 'old@example.com'), 'new@example.com');
  assert.throws(() => normalizeNewEmail('not-an-email', 'old@example.com'), /valid email/);
  assert.throws(() => normalizeNewEmail('Old@example.com', 'old@example.com'), /already your current email/);
});

test('recovery errors name the provider and how to continue', () => {
  const google = { type: 'oauth', providerId: 'google.com' };
  assert.equal(
    emailChangeErrorMessage(emailChangeError('auth/unsupported-provider', 'x'), {
      type: 'unsupported',
      providerIds: [],
    }),
    EMAIL_CHANGE_UNSUPPORTED_MESSAGE,
  );
  assert.equal(
    emailChangeErrorMessage({ code: 'auth/user-mismatch' }, google),
    'The Google account you selected does not match this profile. Use the account you originally signed in with.',
  );
  assert.equal(
    emailChangeErrorMessage({ code: 'auth/popup-blocked' }, google),
    'Please allow pop-ups, or sign out and sign in again, then retry the email change.',
  );
  assert.equal(
    emailChangeErrorMessage({ code: 'auth/popup-closed-by-user' }, { type: 'oauth', providerId: 'apple.com' }),
    'Apple confirmation was cancelled.',
  );
  assert.equal(
    emailChangeErrorMessage({ code: 'auth/wrong-password' }, { type: 'password' }),
    'Incorrect password. Please try again.',
  );
  assert.equal(
    emailChangeErrorMessage({ code: 'auth/requires-recent-login' }, { type: 'password' }),
    'Please sign out and sign in again to continue.',
  );
});

test('change-email reauthenticates Google-only accounts then sends verification', async () => {
  const { adapters, calls } = recordingAdapters();
  const result = await runChangeEmail(user(['google.com']), 'new@example.com', '', adapters);
  assert.equal(result, 'verification-sent');
  assert.deepEqual(calls, [
    ['popup', 'google.com'],
    ['verify', 'new@example.com'],
    ['write', { email: 'new@example.com', phase: 'verify' }],
  ]);
});

test('change-email falls back to redirect when the OAuth popup is blocked', async () => {
  const { adapters, calls } = recordingAdapters({
    reauthenticateWithPopup: async () => {
      throw emailChangeError('auth/popup-blocked', 'blocked');
    },
  });
  const result = await runChangeEmail(user(['apple.com']), 'new@example.com', '', adapters);
  assert.equal(result, 'redirect');
  assert.deepEqual(calls, [
    ['write', { email: 'new@example.com', phase: 'reauth' }],
    ['redirect', 'apple.com'],
  ]);
});

test('change-email still uses the current password when one is on the account', async () => {
  const { adapters, calls } = recordingAdapters();
  const result = await runChangeEmail(user(['password', 'google.com']), 'new@example.com', 'secret', adapters);
  assert.equal(result, 'verification-sent');
  assert.deepEqual(calls, [
    ['password', 'secret'],
    ['verify', 'new@example.com'],
    ['write', { email: 'new@example.com', phase: 'verify' }],
  ]);
});

test('unsupported accounts fail closed with a recovery error before any reauth', async () => {
  const { adapters, calls } = recordingAdapters();
  await assert.rejects(
    () => runChangeEmail(user(['facebook.com']), 'new@example.com', '', adapters),
    (error) => {
      assert.equal(error.code, 'auth/unsupported-provider');
      assert.equal(error.message, EMAIL_CHANGE_UNSUPPORTED_MESSAGE);
      return true;
    },
  );
  assert.deepEqual(calls, []);
});

test('a completed OAuth redirect sends the stored verification mail', async () => {
  const { adapters, calls } = recordingAdapters({
    readPending: () => ({ email: 'new@example.com', phase: 'reauth' }),
    getRedirectResult: async () => ({ user: user(['google.com']) }),
  });
  const result = await runCompletePendingEmailChange(user(['google.com']), adapters);
  assert.equal(result, 'verification-sent');
  assert.deepEqual(calls, [
    ['verify', 'new@example.com'],
    ['write', { email: 'new@example.com', phase: 'verify' }],
  ]);
});

test('pending email-change state round-trips and rejects junk', () => {
  assert.deepEqual(parsePendingEmailChange(JSON.stringify({ email: 'a@b.com', phase: 'reauth' })), {
    email: 'a@b.com',
    phase: 'reauth',
  });
  assert.equal(parsePendingEmailChange('{'), null);
  assert.equal(parsePendingEmailChange(JSON.stringify({ email: 'a@b.com', phase: 'done' })), null);
});

test('profile email editor offers OAuth continue for provider-only accounts', async () => {
  const service = await src('src/features/profile/services/profileService.ts');
  const actions = await src('src/features/profile/hooks/useProfileActions.ts');
  const info = await src('src/features/profile/components/ProfileInfo.tsx');

  assert.match(service, /runChangeEmail/);
  assert.match(service, /firebaseReauthenticateWithPopup/);
  assert.match(service, /firebaseReauthenticateWithRedirect/);
  assert.match(actions, /emailChangeErrorMessage/);
  assert.match(actions, /completePendingEmailChange/);
  assert.match(info, /emailChangeReauthMethod/);
  assert.match(info, /Continue with \{OAUTH_PROVIDER_LABEL\[reauth\.providerId\]\}/);
  assert.match(info, /EMAIL_CHANGE_UNSUPPORTED_MESSAGE/);
  assert.match(info, /reauth\.type === 'password'/);
  assert.equal(EMAIL_CHANGE_VERIFY_MESSAGE.includes('Verification email sent'), true);
});
