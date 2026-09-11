import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, doc, setDoc, updateDoc } from 'firebase/firestore';

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

describe('sensitive write type, length, and immutable-field validation', () => {
  test('profile writes reject wrong types, oversized fields, and identity mutation', async () => {
    const owner = dbFor('member-a');
    const users = doc(owner, 'users/member-a');

    await assertSucceeds(
      setDoc(users, {
        uid: 'member-a',
        name: 'Member A',
        avatar: '',
        created_at: '2026-01-01T00:00:00.000Z',
      }),
    );
    await assertSucceeds(updateDoc(users, { bio: 'x'.repeat(300) }));
    await assertSucceeds(updateDoc(users, { lastActive: Timestamp.now() }));
    await assertSucceeds(updateDoc(users, { display_badges: ['play5', 'visit1', 'streak3'] }));

    await assertFails(updateDoc(users, { bio: 'x'.repeat(301) }));
    await assertFails(updateDoc(users, { name: 12 }));
    await assertFails(updateDoc(users, { display_badges: ['a', 'b', 'c', 'd'] }));
    await assertFails(updateDoc(users, { isVerified: 'yes' }));
    await assertFails(updateDoc(users, { created_at: '2026-02-01T00:00:00.000Z' }));
    await assertFails(updateDoc(users, { uid: 'member-b' }));
  });

  test('contact writes accept string or list contact methods and reject oversized PII', async () => {
    const owner = dbFor('member-a');
    const contacts = doc(owner, 'contacts/member-a');

    await assertSucceeds(
      setDoc(contacts, {
        email: 'member-a@example.invalid',
        phone: '+14165550100',
        preferred_mode_of_contact: 'email',
        contactable: true,
        updated_at: '2026-01-01T00:00:00.000Z',
      }),
    );
    await assertSucceeds(updateDoc(contacts, { preferred_mode_of_contact: ['email', 'text'] }));
    await assertSucceeds(updateDoc(contacts, { preferred_mode_of_contact: [] }));

    await assertFails(updateDoc(contacts, { email: 'x'.repeat(321) }));
    await assertFails(updateDoc(contacts, { phone: 14165550100 }));
    await assertFails(updateDoc(contacts, { contactable: 'yes' }));
    await assertFails(updateDoc(contacts, { preferred_mode_of_contact: { email: true } }));
  });

  test('owner stats reject out-of-range skill, wrong types, and protected-field writes', async () => {
    const stats = doc(dbFor('member-a'), 'stats/member-a');

    await assertSucceeds(
      setDoc(stats, {
        uid: 'member-a',
        name: 'Member A',
        skill_level: 3.5,
        tournament_preference: 'Challengers',
        league: "Men's",
        leaguePoints26: 0,
        wins: 0,
        loses: 0,
        matchesPlayed: 0,
        tournamentsPlayed: 0,
      }),
    );
    await assertSucceeds(updateDoc(stats, { skill_level: 4.5, tournament_preference: 'Masters' }));

    await assertFails(updateDoc(stats, { skill_level: 9 }));
    await assertFails(updateDoc(stats, { skill_level: '3.5' }));
    await assertFails(updateDoc(stats, { tournament_preference: 'Open' }));
    await assertFails(updateDoc(stats, { name: 'x'.repeat(321) }));
    await assertFails(updateDoc(stats, { uid: 'member-b' }));
  });

  test('preference writes bound list sizes and keep role flags immutable for owners', async () => {
    const preferences = doc(dbFor('member-a'), 'preferences/member-a');

    await assertSucceeds(
      setDoc(preferences, {
        uid: 'member-a',
        event_creator: false,
        preferred_courts: ['Ramsden Park'],
        availability_tags: ['weekday-evening'],
        email_notifications: true,
      }),
    );
    await assertSucceeds(updateDoc(preferences, { favourite_players: ['member-b'] }));
    await assertSucceeds(updateDoc(preferences, { available_to_play: true }));

    await assertFails(updateDoc(preferences, { preferred_courts: Array.from({ length: 51 }, (_, i) => `c${i}`) }));
    await assertFails(updateDoc(preferences, { preferred_courts: 'Ramsden Park' }));
    await assertFails(updateDoc(preferences, { email_notifications: 'yes' }));
    await assertFails(updateDoc(preferences, { uid: 'member-b' }));
    await assertFails(updateDoc(preferences, { event_creator: true }));
  });

  test('listings reject oversized copy, invalid prices, extra photos, and immutable identity', async () => {
    const owner = dbFor('member-a');
    const listing = {
      uid: 'member-a',
      kind: 'sell',
      status: 'available',
      title: 'Synthetic racquet',
      description: 'Grip replaced.',
      condition: 'Good',
      price: 40,
      pickup: 'Midtown',
      photo_paths: ['listings/member-a/a.png'],
      created_at: '2026-09-11T00:00:00.000Z',
    };

    await assertSucceeds(setDoc(doc(owner, 'listings/listing-a'), listing));
    await assertSucceeds(updateDoc(doc(owner, 'listings/listing-a'), { status: 'sold' }));

    await assertFails(setDoc(doc(owner, 'listings/listing-long'), { ...listing, title: 'x'.repeat(121) }));
    await assertFails(setDoc(doc(owner, 'listings/listing-price'), { ...listing, price: -1 }));
    await assertFails(setDoc(doc(owner, 'listings/listing-photos'), { ...listing, photo_paths: ['a', 'b', 'c', 'd'] }));
    await assertFails(setDoc(doc(owner, 'listings/listing-condition'), { ...listing, condition: 'Mint' }));
    await assertFails(updateDoc(doc(owner, 'listings/listing-a'), { uid: 'member-b' }));
    await assertFails(updateDoc(doc(owner, 'listings/listing-a'), { kind: 'rent' }));
    await assertFails(updateDoc(doc(owner, 'listings/listing-a'), { created_at: '2026-09-12T00:00:00.000Z' }));
  });

  test('event writes bound title length and keep creator_id immutable', async () => {
    await seedDoc('preferences/creator-a', { uid: 'creator-a', event_creator: true });
    const creator = dbFor('creator-a');
    const base = {
      title: 'Canonical Event',
      creator_id: 'creator-a',
      location: 'Anywhere',
      type: 'Tournaments',
    };

    await assertSucceeds(setDoc(doc(creator, 'events/canonical'), base));
    await assertSucceeds(updateDoc(doc(creator, 'events/canonical'), { title: 'Updated' }));
    await assertFails(setDoc(doc(creator, 'events/too-long'), { ...base, title: 'x'.repeat(201) }));
    await assertFails(updateDoc(doc(creator, 'events/canonical'), { creator_id: 'creator-b' }));
    await assertFails(updateDoc(doc(creator, 'events/canonical'), { organizer_ids: ['member-a'] }));
  });

  test('participant and partner-pool writes bound identity fields and keep them immutable', async () => {
    await seedDoc('events/synthetic-event', { id: 'synthetic-event', creator_id: 'organizer-a' });
    await seedDoc('preferences/organizer-a', { uid: 'organizer-a', event_creator: true });
    const member = dbFor('member-a');

    await assertSucceeds(
      setDoc(doc(member, 'event_participants/join-a'), {
        id: 'join-a',
        event_id: 'synthetic-event',
        uid: 'member-a',
        created_at: '2026-01-01T00:00:00.000Z',
        user_name: 'Member A',
        skill: 3.5,
      }),
    );
    await assertSucceeds(updateDoc(doc(member, 'event_participants/join-a'), { dateselected: ['2026-08-19'] }));
    await assertFails(
      setDoc(doc(member, 'event_participants/join-long'), {
        id: 'join-long',
        event_id: 'synthetic-event',
        uid: 'member-a',
        created_at: '2026-01-01T00:00:00.000Z',
        user_name: 'x'.repeat(321),
      }),
    );
    await assertFails(updateDoc(doc(member, 'event_participants/join-a'), { skill: 9 }));
    await assertFails(updateDoc(doc(dbFor('organizer-a'), 'event_participants/join-a'), { uid: 'organizer-a' }));

    await assertSucceeds(
      setDoc(doc(member, 'partner_pool/synthetic-event/members/member-a'), {
        uid: 'member-a',
        name: 'Member A',
        category: 'mens',
        skill: 3.5,
        created_at: '2026-08-25T00:00:00.000Z',
      }),
    );
    await assertFails(
      setDoc(doc(member, 'partner_pool/other-event/members/member-a'), {
        uid: 'member-a',
        name: 'Member A',
        category: 'open',
        skill: 3.5,
        created_at: '2026-08-25T00:00:00.000Z',
      }),
    );
  });

  test('court reports, claims, tasks, and rally creates enforce remaining bounds', async () => {
    const owner = dbFor('member-a');
    await seedDoc('stats/member-a', { location: 'Toronto' });
    await seedDoc('stats/member-b', { location: 'Toronto' });

    await assertSucceeds(
      setDoc(doc(owner, 'courts/member-a_check-in'), {
        type: 'check-in',
        uid: 'member-a',
        court_key: 'synthetic-court',
        dist_m: 25,
        created_at: '2026-08-19T00:00:00.000Z',
      }),
    );
    await assertFails(
      setDoc(doc(owner, 'courts/member-a_negative'), {
        type: 'check-in',
        uid: 'member-a',
        court_key: 'synthetic-court',
        dist_m: -1,
        created_at: '2026-08-19T00:00:00.000Z',
      }),
    );

    const report = {
      type: 'condition',
      uid: 'member-a',
      court_key: 'synthetic-court',
      photo_paths: ['court_reports/member-a/report.png'],
      note: 'Dry surface',
      status: 'approved',
    };
    await assertSucceeds(setDoc(doc(owner, 'courts/report-a'), report));
    await assertFails(setDoc(doc(owner, 'courts/report-long'), { ...report, note: 'x'.repeat(2001) }));
    await assertFails(
      setDoc(doc(owner, 'courts/report-photos'), {
        ...report,
        photo_paths: ['a', 'b', 'c', 'd'],
      }),
    );

    await assertSucceeds(
      setDoc(doc(owner, 'tasks/member-a'), {
        uid: 'member-a',
        name: 'Member A',
        profileComplete: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    await assertFails(updateDoc(doc(owner, 'tasks/member-a'), { profileComplete: 'yes' }));

    await assertSucceeds(
      setDoc(doc(owner, 'task_claims/claim-a'), {
        uid: 'member-a',
        type: 'volunteer',
        status: 'pending',
        note: 'Synthetic claim',
      }),
    );
    await assertFails(
      setDoc(doc(owner, 'task_claims/claim-long'), {
        uid: 'member-a',
        type: 'volunteer',
        status: 'pending',
        note: 'x'.repeat(501),
      }),
    );

    await assertSucceeds(
      setDoc(doc(owner, 'matches/rally-a'), {
        category: 'rally',
        player_1_uid: 'member-a',
        player_1_name: 'Member A',
        player_2_uid: 'member-b',
        player_2_name: 'Member B',
        status: 'open',
        created_at: '2026-08-19T00:00:00.000Z',
      }),
    );
    await assertFails(
      setDoc(doc(owner, 'matches/rally-long'), {
        category: 'rally',
        player_1_uid: 'member-a',
        player_1_name: 'x'.repeat(321),
        player_2_uid: 'member-b',
        player_2_name: 'Member B',
        status: 'open',
        created_at: '2026-08-19T00:00:00.000Z',
      }),
    );
    await assertFails(
      setDoc(doc(owner, 'matches/rally-extra'), {
        category: 'rally',
        player_1_uid: 'member-a',
        player_1_name: 'Member A',
        player_2_uid: 'member-b',
        player_2_name: 'Member B',
        status: 'open',
        created_at: '2026-08-19T00:00:00.000Z',
        padded: 'x'.repeat(1000),
      }),
    );
  });

  test('notification read markers stay typed and other fields stay immutable', async () => {
    await seedDoc('notifications/notification-a', {
      uid: 'member-a',
      type: 'synthetic',
      title: 'Synthetic notification',
      read: false,
    });
    const owner = dbFor('member-a');

    await assertSucceeds(
      updateDoc(doc(owner, 'notifications/notification-a'), {
        read: true,
        read_at: '2026-08-19T00:01:00.000Z',
      }),
    );
    await assertFails(updateDoc(doc(owner, 'notifications/notification-a'), { read: 'yes' }));
    await assertFails(updateDoc(doc(owner, 'notifications/notification-a'), { title: 'Forged' }));
  });
});
