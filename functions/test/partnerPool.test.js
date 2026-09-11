const assert = require('node:assert/strict');
const { test } = require('node:test');
const { contactProjection, poolNotification } = require('../lib/partnerPool');

test('pool projection copies a filled email', () => {
  assert.deepEqual(contactProjection({ email: ' player@example.com ' }), { email: 'player@example.com' });
});

test('pool projection copies a filled phone', () => {
  assert.deepEqual(contactProjection({ phone: '416-555-0100' }), { phone: '416-555-0100' });
});

test('pool projection copies a dedicated WhatsApp channel', () => {
  assert.deepEqual(contactProjection({ whatsapp_contact: '+14165550100' }), {
    whatsapp_contact: '+14165550100',
  });
});

test('pool projection keeps contact preferences when supplied', () => {
  assert.deepEqual(contactProjection({ preferred_mode_of_contact: ['whatsapp'] }), {
    preferred_mode_of_contact: ['whatsapp'],
  });
});

test('pool projection does not publish empty channels', () => {
  assert.deepEqual(contactProjection({ email: '', phone: ' ', whatsapp_contact: '' }), {});
});

test('same-phone WhatsApp is retained only with a phone channel', () => {
  assert.deepEqual(contactProjection({ phone: '416-555-0100', whatsapp_same_as_phone: true }), {
    phone: '416-555-0100',
    whatsapp_same_as_phone: true,
  });
});

test('pool join notification excludes no one itself and links to the event pool surface', () => {
  assert.deepEqual(poolNotification('event-1', 'Spring Open', { name: 'Ava', category: 'mens' }), {
    type: 'partner_pool_joined',
    title: 'A new player is waiting to partner up!',
    body: 'Ava joined the mens doubles pool for Spring Open.',
    link: '/tournament?event=event-1',
  });
});
