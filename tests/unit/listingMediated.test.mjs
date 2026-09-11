import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  LISTING_CONTACT_COLLECTION,
  LISTING_FIELDS,
  LISTINGS_COLLECTION,
  buildListingDocument,
  emptyDraft,
  normalizeListingContact,
} from '../../src/features/marketplace/listingDocument.ts';

const listingSource = await readFile(
  new URL('../../src/features/marketplace/listingService.ts', import.meta.url),
  'utf8',
);
const marketplaceSource = await readFile(new URL('../../src/pages/Marketplace.tsx', import.meta.url), 'utf8');
const formSource = await readFile(
  new URL('../../src/pages/marketplace/MarketplaceElements.tsx', import.meta.url),
  'utf8',
);

test('a posted listing is an allowlisted listings document with no contact channels', () => {
  const sell = buildListingDocument(
    'member-a',
    'Synthetic Member',
    { ...emptyDraft('sell'), title: 'Wilson blade', description: 'Grip 4 3/8', price: '40', pickup: 'Midtown' },
    ['listings/member-a/racquet.png'],
    '2026-09-11T00:00:00.000Z',
  );
  const rent = buildListingDocument(
    'member-a',
    'Synthetic Member',
    {
      ...emptyDraft('rent'),
      title: 'Ball hopper',
      description: 'Holds 70',
      price: '10',
      pickup: 'Midtown',
      duration: '2 weeks',
    },
    [],
    '2026-09-11T00:00:00.000Z',
  );

  for (const key of Object.keys(sell)) assert.equal(LISTING_FIELDS.includes(key), true, key);
  for (const key of Object.keys(rent)) assert.equal(LISTING_FIELDS.includes(key), true, key);
  assert.equal('email' in sell || 'phone' in sell || 'secondary_email' in sell, false);
  assert.equal(sell.status, 'available');
  assert.equal(sell.kind, 'sell');
  assert.equal(sell.duration, undefined);
  assert.equal(rent.duration, '2 weeks');
  assert.equal(LISTINGS_COLLECTION, 'listings');
});

test('listing contact drops private account fields and empty projections', () => {
  assert.equal(normalizeListingContact({}), undefined);
  assert.deepEqual(
    normalizeListingContact({
      email: ' seller@example.invalid ',
      phone: '+14165550100',
      secondary_email: 'secret@example.invalid',
      preferred_mode_of_contact: 'email',
      uid: 'member-a',
      reason: 'listing',
    }),
    {
      email: 'seller@example.invalid',
      phone: '+14165550100',
      preferred_mode_of_contact: ['email'],
      contactable: true,
    },
  );
  assert.equal(LISTING_CONTACT_COLLECTION, 'public_contacts');
});

test('marketplace posting and seller contact stay on the listing-mediated path', () => {
  assert.match(listingSource, /collection\(db, LISTINGS_COLLECTION\)/);
  assert.match(listingSource, /getDoc\(doc\(db, LISTING_CONTACT_COLLECTION, id\)\)/);
  assert.doesNotMatch(listingSource, /collection\(db, ['"]contacts['"]\)/);
  assert.doesNotMatch(listingSource, /doc\(db, ['"]contacts['"]/);
  assert.match(marketplaceSource, /useListingContacts/);
  assert.doesNotMatch(marketplaceSource, /['"]contacts['"]/);
  assert.match(formSource, /createListing\(/);
});
