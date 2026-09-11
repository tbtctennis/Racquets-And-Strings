import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { contactChannels } from '../../src/components/ContactOpponentButton.tsx';
import {
  isActiveRosterParticipant,
  organizerOverviewContact,
  selectOrganizerOverviewParticipants,
} from '../../src/features/contacts/organizerOverviewContact.ts';
import { OrganizerOverviewPanel } from '../../src/pages/tournament/TournamentElements.tsx';

const participant = (overrides = {}) => ({
  id: overrides.id ?? overrides.uid ?? 'p1',
  uid: 'p1',
  user_name: 'Ada Lovelace',
  event_id: 'e1',
  tournament_choice: 'Singles',
  division: "Men's",
  skill: 4,
  created_at: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const renderOverview = (people, contactsByUid) =>
  renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(OrganizerOverviewPanel, { people, contactsByUid })),
  );

test('active roster matches the connections participant rule', () => {
  assert.equal(isActiveRosterParticipant({}), true);
  assert.equal(isActiveRosterParticipant({ status: 'active' }), true);
  assert.equal(isActiveRosterParticipant({ status: 'withdrawn' }), false);
  assert.equal(isActiveRosterParticipant({ status: 'removed' }), false);
  assert.equal(isActiveRosterParticipant({ status: 'inactive' }), false);
  assert.equal(isActiveRosterParticipant({ removal: true }), false);
  assert.equal(isActiveRosterParticipant({ active: false }), false);
});

test('organizer overview lists unique active sign-ups and skips the viewer', () => {
  const people = selectOrganizerOverviewParticipants(
    [
      participant({ uid: 'org', user_name: 'Organizer' }),
      participant({ uid: 'p2', user_name: 'blake bell', skill: 3 }),
      participant({ id: 'dup', uid: 'p2', user_name: 'Blake Duplicate' }),
      participant({ uid: 'p3', user_name: 'Withdrawn', status: 'withdrawn' }),
      participant({ uid: 'p4', user_name: 'Removed', removal: true }),
      participant({ uid: '__player_loading__', user_name: 'Player Loading' }),
      participant({ uid: '  ', user_name: 'Blank' }),
    ],
    'org',
  );

  assert.deepEqual(
    people.map((row) => row.uid),
    ['p2'],
  );
  assert.equal(people[0].name, 'blake bell');
  assert.equal(people[0].meta, "Singles · Men's · skill 3");
});

test('organizer overview withholds contact when the connection read did not resolve', () => {
  assert.equal(organizerOverviewContact(undefined), null);
  assert.deepEqual(organizerOverviewContact({ phone: '4165550100', email: 'ada@example.com' }), {
    phone: '4165550100',
    email: 'ada@example.com',
    whatsapp_contact: undefined,
    preferred_mode_of_contact: undefined,
  });
});

test('approved contact channels follow preferred_mode_of_contact', () => {
  const contact = {
    phone: '4165550100',
    email: 'ada@example.com',
    whatsapp_contact: '+14165550100',
    preferred_mode_of_contact: ['email'],
  };
  const preferred = contactChannels({
    phone: contact.phone,
    email: contact.email,
    whatsappContact: contact.whatsapp_contact,
    preferred: contact.preferred_mode_of_contact,
  });
  const all = contactChannels({
    phone: contact.phone,
    email: contact.email,
    whatsappContact: contact.whatsapp_contact,
  });

  assert.deepEqual(
    preferred.map((channel) => channel.key),
    ['email'],
  );
  assert.deepEqual(
    all.map((channel) => channel.key),
    ['email', 'text', 'whatsapp'],
  );
});

test('organizer overview renders ContactOpponentButton only for resolved contacts', () => {
  const people = selectOrganizerOverviewParticipants([
    participant({ uid: 'p1', user_name: 'Ada Lovelace' }),
    participant({ uid: 'p2', user_name: 'Grace Hopper' }),
  ]);
  const html = renderOverview(people, {
    p1: {
      phone: '4165550100',
      email: 'ada@example.com',
      preferred_mode_of_contact: ['email'],
    },
  });

  assert.match(html, /Players \(2\)/);
  assert.match(html, /href="\/players\/p1"/);
  assert.match(html, /href="mailto:ada@example.com"/);
  assert.doesNotMatch(html, /sms:/);
  assert.doesNotMatch(html, /href="mailto:grace/);
  assert.match(html, /Grace Hopper|Grace H/);
});

test('organizer overview hides when the active roster is empty', () => {
  const html = renderOverview([], {});
  assert.equal(html, '');
});

test('tournament page mounts the organizer overview and reuses ContactOpponentButton', async () => {
  const page = await readFile(new URL('../../src/pages/Tournament.tsx', import.meta.url), 'utf8');
  const elements = await readFile(
    new URL('../../src/pages/tournament/TournamentElements.tsx', import.meta.url),
    'utf8',
  );

  assert.match(page, /OrganizerOverviewPanel/);
  assert.match(page, /useContacts/);
  assert.match(page, /selectOrganizerOverviewParticipants/);
  assert.match(elements, /ContactOpponentButton/);
  assert.match(elements, /organizerOverviewContact/);
});
