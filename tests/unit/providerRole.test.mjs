import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveProviderRole } from '../../src/features/services/providerRole.ts';
import { isCanonicalProviderFor, inferProviderRoleFromPreferences } from '../../scripts/lib/provider-role.mjs';

test('client provider role comes only from a providers row', () => {
  assert.deepEqual(resolveProviderRole({ id: 'karan', name: 'Karan', roles: ['stringer'], member_uid: 'member-a' }), {
    providerId: 'karan',
    role: 'stringer',
  });
  assert.deepEqual(resolveProviderRole(null), { providerId: null, role: null });
});

test('canonical provider checks ignore leftover preference inference', () => {
  const inferred = inferProviderRoleFromPreferences({
    uid: 'legacy-a',
    stringer: true,
    stringer_id: 'shop-a',
  });
  assert.deepEqual(inferred, [{ providerId: 'shop-a', role: 'stringer', memberUid: 'legacy-a' }]);
  assert.equal(isCanonicalProviderFor('legacy-a', 'shop-a', []), false);
  assert.equal(
    isCanonicalProviderFor('canonical-a', 'shop-a', [{ id: 'shop-a', member_uid: 'canonical-a', roles: ['stringer'] }]),
    true,
  );
  assert.equal(
    isCanonicalProviderFor('legacy-a', 'shop-a', [{ id: 'shop-a', member_uid: 'canonical-a', roles: ['stringer'] }]),
    false,
  );
});
