import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_AUTH_REDIRECT, getLoginPath, getSafeAuthRedirect } from '../../src/features/auth/authRedirect.ts';

test('auth redirects preserve validated in-app paths and query strings', () => {
  const destination = '/matches?mode=tournament&event=e2e-round-robin#knockout';

  assert.equal(getSafeAuthRedirect(destination), destination);
  assert.equal(getLoginPath(destination), `/login?next=${encodeURIComponent(destination)}`);
});

test('auth redirects reject external, protocol-relative, and auth-loop destinations', () => {
  for (const candidate of ['https://example.com', '//example.com', '/\\example.com', '/login', '/signup']) {
    assert.equal(getSafeAuthRedirect(candidate), DEFAULT_AUTH_REDIRECT, candidate);
    assert.equal(getLoginPath(candidate), '/login', candidate);
  }
});
