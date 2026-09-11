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
const anonDb = () => testEnv.unauthenticatedContext().firestore();

const seedDoc = async (path, data) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
};

const sensitive = {
  email: 'private@example.invalid',
  phone: '+14165550100',
  secondary_email: 'recovery@example.invalid',
  whatsapp_contact: '+14165550101',
  contact_phone: '+14165550110',
  contact_email: 'catalog@example.invalid',
};

const publicSeeds = [
  ['users/member-a', { uid: 'member-a', name: 'Member A' }],
  ['stats/member-a', { uid: 'member-a', name: 'Member A', leaguePoints26: 4 }],
  ['preferences/member-a', { uid: 'member-a', event_creator: false, preferred_courts: ['Ramsden Park'] }],
  ['providers/provider-a', { id: 'provider-a', name: 'Shop A', roles: ['stringer'], member_uid: 'provider-user' }],
  ['events/event-a', { id: 'event-a', title: 'Open', creator_id: 'organizer-a' }],
  ['site_stats/summary', { counts: { players: 3 } }],
  ['tasks/member-a', { uid: 'member-a', name: 'Member A', profileComplete: true }],
  ['ranking_history/member-a/entries/2026-08-18', { date: '2026-08-18', position: 12, direction: 'up' }],
  ['services/service-a', { id: 'service-a', provider_id: 'provider-a', contact_email: 'catalog@example.invalid' }],
  ['listings/listing-a', { uid: 'member-a', kind: 'sell', title: 'Racquet', status: 'available' }],
];

describe('public-field sensitivity contract', () => {
  test('world-readable surfaces are anonymous-readable and keep catalog contact as a recorded exception', async () => {
    for (const [path, data] of publicSeeds) {
      await seedDoc(path, data);
    }

    for (const [path] of publicSeeds) {
      await assertSucceeds(getDoc(doc(anonDb(), path)));
      await assertSucceeds(getDoc(doc(dbFor('member-b'), path)));
    }

    const catalog = await assertSucceeds(getDoc(doc(anonDb(), 'services/service-a')));
    if (catalog.data().contact_email !== 'catalog@example.invalid') {
      throw new Error('services catalog contact exception missing');
    }
  });

  test('private and reserved surfaces are not world-readable', async () => {
    const privateSeeds = [
      ['contacts/member-a', { email: 'member-a@example.invalid', phone: '+14165550100' }],
      ['mailing_list/signup-a', { email: 'signup@example.invalid' }],
      ['admin_stats/current', { members: 10 }],
      ['offers/member-a', { uid: 'member-a', pointsSpent: 0 }],
      ['bookings/book-a', { uid: 'member-a', provider_id: 'provider-a', status: 'lead' }],
      ['payments/pay-a', { uid: 'member-a', amount: 10 }],
      ['public_preferences/member-a', { uid: 'member-a', preferred_zone: 'north' }],
      ['notifications/note-a', { uid: 'member-a', title: 'Result' }],
      ['connections/member-a__member-c', { uids: ['member-a', 'member-c'], reason: 'tournament_match' }],
      ['redemptions/CODE-001', { uid: 'member-a', stringer_id: 'provider-a', status: 'active' }],
      ['public_contacts/member-a', { uid: 'member-a', reason: 'listing', email: 'member-a@example.invalid' }],
      ['partner_pool/event-a/contacts/member-a', { email: 'member-a@example.invalid' }],
      ['group_lesson_contact_access/member-a', { uid: 'member-a' }],
      ['events/event-a/rr_drafts/draw-a', { groups: [] }],
    ];
    for (const [path, data] of privateSeeds) {
      await seedDoc(path, data);
      try {
        await assertFails(getDoc(doc(anonDb(), path)));
      } catch (error) {
        error.message = `${path}: ${error.message}`;
        throw error;
      }
    }

    await assertFails(getDoc(doc(dbFor('member-b'), 'contacts/member-a')));
    await assertFails(getDoc(doc(dbFor('member-b'), 'mailing_list/signup-a')));
    await assertFails(getDoc(doc(dbFor('member-b'), 'admin_stats/current')));
    await assertFails(getDoc(doc(dbFor('member-b'), 'offers/member-a')));
    await assertFails(getDoc(doc(dbFor('member-b'), 'public_preferences/member-a')));
    await assertFails(getDoc(doc(dbFor('member-b'), 'partner_pool/event-a/contacts/member-a')));
    await assertFails(getDoc(doc(dbFor('member-b'), 'events/event-a/rr_drafts/draw-a')));
  });

  test('member-wide surfaces are authenticated-only and reject contact fields', async () => {
    await seedDoc('events/event-a', { id: 'event-a', creator_id: 'organizer-a' });
    await seedDoc('event_participants/join-a', {
      id: 'join-a',
      uid: 'member-a',
      event_id: 'event-a',
      user_name: 'Member A',
    });
    await seedDoc('partner_pool/event-a/members/member-a', { uid: 'member-a', name: 'Member A', category: 'mens' });
    await seedDoc('matches/match-a', { event_id: 'event-a', category: 'singles', status: 'pending' });
    await seedDoc('courts/member-a_checkin', { type: 'check-in', uid: 'member-a', court_name: 'Ramsden Park' });
    await seedDoc('court_resolutions/ramsden-park', { court_name: 'Ramsden Park', zone: 'Downtown - Midtown' });
    await seedDoc('public_contacts/member-a', {
      uid: 'member-a',
      reason: 'listing',
      email: 'member-a@example.invalid',
    });

    const memberWide = [
      'event_participants/join-a',
      'partner_pool/event-a/members/member-a',
      'matches/match-a',
      'courts/member-a_checkin',
      'court_resolutions/ramsden-park',
      'public_contacts/member-a',
    ];
    for (const path of memberWide) {
      await assertFails(getDoc(doc(anonDb(), path)));
      await assertSucceeds(getDoc(doc(dbFor('member-b'), path)));
    }

    const owner = dbFor('member-a');
    await assertFails(
      setDoc(doc(owner, 'event_participants/join-leak'), {
        id: 'join-leak',
        uid: 'member-a',
        event_id: 'event-a',
        created_at: '2026-01-01T00:00:00.000Z',
        email: sensitive.email,
      }),
    );
    await assertFails(
      setDoc(doc(owner, 'partner_pool/event-a/members/member-a'), {
        uid: 'member-a',
        name: 'Member A',
        category: 'mens',
        skill: 3.5,
        created_at: '2026-08-25T00:00:00.000Z',
        phone: sensitive.phone,
      }),
    );
    await assertFails(
      setDoc(doc(owner, 'courts/member-a_report'), {
        type: 'condition',
        uid: 'member-a',
        user_name: 'Member A',
        court_key: 'ramsden-park',
        court_name: 'Ramsden Park',
        photo_paths: [],
        status: 'approved',
        created_at: '2026-09-11T00:00:00.000Z',
        email: sensitive.email,
      }),
    );
  });

  test('clients cannot smuggle contact fields onto public identity, stats, preferences, tasks, or listings', async () => {
    const owner = dbFor('member-a');

    await assertSucceeds(setDoc(doc(owner, 'users/member-a'), { uid: 'member-a', name: 'Member A' }));
    await assertFails(
      setDoc(doc(owner, 'users/member-a'), { uid: 'member-a', name: 'Member A', email: sensitive.email }),
    );
    await assertFails(updateDoc(doc(owner, 'users/member-a'), { phone: sensitive.phone }));
    await assertFails(updateDoc(doc(owner, 'users/member-a'), { secondary_email: sensitive.secondary_email }));

    await assertSucceeds(
      setDoc(doc(owner, 'stats/member-a'), {
        uid: 'member-a',
        name: 'Member A',
        leaguePoints26: 0,
        wins: 0,
        loses: 0,
        matchesPlayed: 0,
        tournamentsPlayed: 0,
      }),
    );
    await assertFails(updateDoc(doc(owner, 'stats/member-a'), { email: sensitive.email }));

    await assertSucceeds(setDoc(doc(owner, 'preferences/member-a'), { uid: 'member-a', event_creator: false }));
    await assertFails(updateDoc(doc(owner, 'preferences/member-a'), { whatsapp_contact: sensitive.whatsapp_contact }));
    await assertFails(updateDoc(doc(owner, 'preferences/member-a'), { stringer: true, stringer_id: 'provider-a' }));

    await assertSucceeds(
      setDoc(doc(owner, 'tasks/member-a'), { uid: 'member-a', name: 'Member A', profileComplete: true }),
    );
    await assertFails(updateDoc(doc(owner, 'tasks/member-a'), { contact_email: sensitive.contact_email }));

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
      user_name: 'Member A',
      created_at: '2026-09-11T00:00:00.000Z',
    };
    await assertSucceeds(setDoc(doc(owner, 'listings/listing-a'), listing));
    await assertFails(setDoc(doc(owner, 'listings/listing-b'), { ...listing, email: sensitive.email }));
    await assertFails(updateDoc(doc(owner, 'listings/listing-a'), { phone: sensitive.phone }));
  });

  test('events and tournament matches reject contact fields on create and update', async () => {
    await seedDoc('preferences/organizer-a', { uid: 'organizer-a', event_creator: true });
    const organizer = dbFor('organizer-a');
    const eventBody = {
      title: 'Sensitivity Open',
      creator_id: 'organizer-a',
      location: 'Ramsden Park',
      type: 'Tournaments',
    };

    await assertSucceeds(setDoc(doc(organizer, 'events/event-a'), eventBody));
    await assertFails(setDoc(doc(organizer, 'events/event-leak'), { ...eventBody, email: sensitive.email }));
    await assertFails(updateDoc(doc(organizer, 'events/event-a'), { contact_phone: sensitive.contact_phone }));
    await assertFails(updateDoc(doc(organizer, 'events/event-a'), { contactable: true }));

    const matchBody = {
      event_id: 'event-a',
      category: 'singles',
      tournament_choice: 'Singles',
      status: 'pending',
    };
    await assertSucceeds(setDoc(doc(organizer, 'matches/match-a'), matchBody));
    await assertFails(setDoc(doc(organizer, 'matches/match-leak'), { ...matchBody, phone: sensitive.phone }));
    await assertFails(updateDoc(doc(organizer, 'matches/match-a'), { secondary_email: sensitive.secondary_email }));
  });

  test('server-owned public collections and contact projections deny client writes', async () => {
    const member = dbFor('member-a');
    await seedDoc('providers/provider-a', { id: 'provider-a', member_uid: 'member-a', roles: ['stringer'] });
    await seedDoc('services/service-a', { id: 'service-a', provider_id: 'provider-a' });
    await seedDoc('site_stats/summary', { counts: { players: 1 } });
    await seedDoc('ranking_history/member-a/entries/2026-08-18', { date: '2026-08-18', position: 1 });
    await seedDoc('public_contacts/member-a', {
      uid: 'member-a',
      reason: 'listing',
      email: 'member-a@example.invalid',
    });
    await seedDoc('partner_pool/event-a/members/member-a', { uid: 'member-a', name: 'Member A', category: 'mens' });
    await seedDoc('partner_pool/event-a/contacts/member-a', { email: 'member-a@example.invalid' });

    await assertFails(setDoc(doc(member, 'providers/provider-b'), { id: 'provider-b', member_uid: 'member-a' }));
    await assertFails(updateDoc(doc(member, 'providers/provider-a'), { roles: ['admin'] }));
    await assertFails(updateDoc(doc(member, 'services/service-a'), { contact_email: sensitive.contact_email }));
    await assertFails(updateDoc(doc(member, 'site_stats/summary'), { counts: { players: 99 } }));
    await assertFails(
      setDoc(doc(member, 'ranking_history/member-a/entries/forged'), { date: '2026-09-11', position: 1 }),
    );
    await assertFails(setDoc(doc(member, 'public_preferences/member-a'), { uid: 'member-a', preferred_zone: 'north' }));
    await assertFails(updateDoc(doc(member, 'public_contacts/member-a'), { email: 'forged@example.invalid' }));
    await assertFails(
      setDoc(doc(member, 'partner_pool/event-a/contacts/member-b'), { email: 'forged@example.invalid' }),
    );

    await assertFails(getDoc(doc(anonDb(), 'public_contacts/member-a')));
    const projected = await assertSucceeds(getDoc(doc(dbFor('member-b'), 'public_contacts/member-a')));
    if (projected.data().email !== 'member-a@example.invalid') throw new Error('listing projection missing email');
    if (projected.data().secondary_email !== undefined) {
      throw new Error('private secondary_email leaked onto public_contacts');
    }
  });

  test('compatibility writes omit optional fields and leftover provider flags stay residue', async () => {
    const owner = dbFor('member-a');

    await assertSucceeds(setDoc(doc(owner, 'users/member-a'), { uid: 'member-a', name: 'Member A' }));
    await assertSucceeds(
      setDoc(doc(owner, 'preferences/member-a'), {
        uid: 'member-a',
        event_creator: false,
      }),
    );
    await assertSucceeds(updateDoc(doc(owner, 'preferences/member-a'), { preferred_courts: ['Ramsden Park'] }));
    await assertFails(updateDoc(doc(owner, 'preferences/member-a'), { event_creator: true }));
    await assertFails(updateDoc(doc(owner, 'preferences/member-a'), { coach: true, coach_id: 'coach-a' }));

    await seedDoc('preferences/legacy-provider', {
      uid: 'legacy-provider',
      event_creator: false,
      stringer: true,
      stringer_id: 'shop-a',
    });
    await assertSucceeds(getDoc(doc(anonDb(), 'preferences/legacy-provider')));
    await assertFails(updateDoc(doc(dbFor('legacy-provider'), 'preferences/legacy-provider'), { stringer: false }));
  });
});
