import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const here = dirname(fileURLToPath(import.meta.url));
const rules = await readFile(resolve(here, '../../firestore.rules'), 'utf8');

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'rands-local',
    firestore: { rules },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const dbFor = (uid) => testEnv.authenticatedContext(uid).firestore();
const seedDoc = async (path, data) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
};

const listing = {
  uid: 'member-a',
  kind: 'sell',
  status: 'available',
  title: 'Synthetic racquet',
  description: 'Grip replaced.',
  condition: 'Good',
  price: 40,
  pickup: 'Midtown',
  photo_paths: [],
  user_name: 'Synthetic Member',
  created_at: '2026-09-11T00:00:00.000Z',
};

describe('listing-mediated marketplace posting', () => {
  test('a member can post an allowlisted listing and buyers read public_contacts, not contacts', async () => {
    const owner = dbFor('member-a');
    const buyer = dbFor('member-c');

    await assertSucceeds(setDoc(doc(owner, 'listings/listing-a'), listing));
    await assertFails(setDoc(doc(owner, 'listings/listing-b'), { ...listing, email: 'side@example.invalid' }));
    await assertFails(setDoc(doc(owner, 'listings/listing-c'), { ...listing, phone: '+14165550100' }));
    await assertFails(updateDoc(doc(owner, 'listings/listing-a'), { email: 'side@example.invalid' }));

    await seedDoc('contacts/member-a', {
      email: 'member-a@example.invalid',
      phone: '+14165550100',
      secondary_email: 'secret@example.invalid',
      preferred_mode_of_contact: ['email'],
      contactable: true,
      updated_at: '2026-09-11T00:00:00.000Z',
    });
    await seedDoc('public_contacts/member-a', {
      uid: 'member-a',
      reason: 'listing',
      email: 'member-a@example.invalid',
      phone: '+14165550100',
      preferred_mode_of_contact: ['email'],
    });

    await assertFails(getDoc(doc(buyer, 'contacts/member-a')));
    const projected = await assertSucceeds(getDoc(doc(buyer, 'public_contacts/member-a')));
    const data = projected.data();
    if (data.email !== 'member-a@example.invalid') throw new Error('listing contact email missing');
    if (data.secondary_email !== undefined) throw new Error('private secondary_email leaked onto public_contacts');
  });
});
