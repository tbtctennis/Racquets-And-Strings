import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizePoolContact, normalizePoolMember } from '../../src/features/partnerPool/normalization.ts';

test('pool member normalization requires a matching document uid', () => {
  assert.equal(normalizePoolMember('member-a', { uid: 'member-b', name: 'Ava' }), null);
  assert.deepEqual(
    normalizePoolMember('member-a', {
      uid: 'member-a',
      name: ' Ava ',
      category: 'mens',
      skill: 3.5,
      created_at: '2026-08-25T00:00:00.000Z',
    }),
    {
      id: 'member-a',
      uid: 'member-a',
      name: 'Ava',
      category: 'mens',
      skill: 3.5,
      created_at: '2026-08-25T00:00:00.000Z',
    },
  );
});

test('pool contact normalization keeps only filled contact channels', () => {
  assert.deepEqual(
    normalizePoolContact({
      email: ' ava@example.com ',
      phone: ' ',
      preferred_mode_of_contact: ['whatsapp', 'invalid', 4],
      contactable: true,
      unrelated_private_field: 'must not escape',
    }),
    { email: 'ava@example.com', preferred_mode_of_contact: ['whatsapp'], contactable: true },
  );
});

test('an empty or denied contact projection normalizes to no contact channels', () => {
  assert.deepEqual(normalizePoolContact({}), {});
  assert.deepEqual(normalizePoolContact({ phone: '', whatsapp_same_as_phone: true }), {});
});
