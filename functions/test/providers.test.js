const assert = require('node:assert/strict');
const { test } = require('node:test');
const { hasProviderRoles } = require('../lib/providers');

test('provider records require a non-empty roles array', () => {
  assert.equal(hasProviderRoles({ roles: ['stringer'], member_uid: 'member-a' }), true);
  assert.equal(hasProviderRoles({ member_uid: 'member-a' }), false);
  assert.equal(hasProviderRoles({ roles: [] }), false);
});
