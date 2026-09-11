import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BookingsList } from '../../src/features/services/BookingsList.tsx';
import { BOOKING_STATUS_LABEL, partitionBookings } from '../../src/features/services/bookingList.ts';

const src = (relative) => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

const booking = (id, status, times = {}) => ({
  id,
  service_id: `service-${id}`,
  provider_id: 'stringer-a',
  uid: 'member-a',
  user_name: 'Synthetic Member',
  status,
  created_at: times.created_at || '2026-01-01T00:00:00.000Z',
  updated_at: times.updated_at || times.created_at || '2026-01-01T00:00:00.000Z',
  ...times,
});

test('completed and cancelled bookings sort below open bookings with a stable order', () => {
  const items = [
    booking('cancelled-old', 'cancelled', {
      created_at: '2026-01-01T00:00:00.000Z',
      cancelled_at: '2026-01-02T00:00:00.000Z',
    }),
    booking('lead-new', 'lead', { created_at: '2026-01-04T00:00:00.000Z' }),
    booking('completed-new', 'completed', {
      created_at: '2026-01-01T00:00:00.000Z',
      completed_at: '2026-01-05T00:00:00.000Z',
    }),
    booking('in-progress', 'in_progress', { created_at: '2026-01-03T00:00:00.000Z' }),
    booking('lead-tie-b', 'lead', { created_at: '2026-01-04T00:00:00.000Z' }),
    booking('lead-tie-a', 'lead', { created_at: '2026-01-04T00:00:00.000Z' }),
  ];

  const first = partitionBookings(items);
  const shuffled = partitionBookings([...items].reverse());

  assert.deepEqual(
    first.open.map((row) => row.id),
    ['lead-tie-b', 'lead-tie-a', 'lead-new', 'in-progress'],
  );
  assert.deepEqual(
    first.past.map((row) => row.id),
    ['completed-new', 'cancelled-old'],
  );
  assert.deepEqual(
    shuffled.open.map((row) => row.id),
    first.open.map((row) => row.id),
  );
  assert.deepEqual(
    shuffled.past.map((row) => row.id),
    first.past.map((row) => row.id),
  );
});

test('past bookings render below open bookings with status labels', () => {
  const items = [
    booking('done', 'completed', {
      created_at: '2026-01-01T00:00:00.000Z',
      completed_at: '2026-01-03T00:00:00.000Z',
    }),
    booking('open', 'lead', { created_at: '2026-01-04T00:00:00.000Z' }),
    booking('dropped', 'in_progress', { created_at: '2026-01-02T00:00:00.000Z' }),
    booking('void', 'cancelled', {
      created_at: '2026-01-01T00:00:00.000Z',
      cancelled_at: '2026-01-02T00:00:00.000Z',
    }),
  ];
  const html = renderToStaticMarkup(
    React.createElement(BookingsList, {
      items,
      titles: {
        'service-open': 'Gut job',
        'service-dropped': 'Hybrid string',
        'service-done': 'Full bed',
        'service-void': 'Lesson',
      },
    }),
  );

  const openHeading = html.indexOf('Open bookings');
  const pastHeading = html.indexOf('Past bookings');
  const gut = html.indexOf('Gut job');
  const hybrid = html.indexOf('Hybrid string');
  const fullBed = html.indexOf('Full bed');
  const lesson = html.indexOf('Lesson');

  assert.ok(openHeading >= 0 && pastHeading > openHeading);
  assert.ok(gut > openHeading && gut < pastHeading);
  assert.ok(hybrid > openHeading && hybrid < pastHeading);
  assert.ok(fullBed > pastHeading);
  assert.ok(lesson > pastHeading);
  assert.ok(gut < hybrid);

  assert.match(html, />Booked</);
  assert.match(html, />In progress</);
  assert.match(html, />Completed</);
  assert.match(html, />Cancelled</);
  assert.equal(BOOKING_STATUS_LABEL.lead, 'Booked');
  assert.equal(BOOKING_STATUS_LABEL.in_progress, 'In progress');
  assert.equal(BOOKING_STATUS_LABEL.completed, 'Completed');
  assert.equal(BOOKING_STATUS_LABEL.cancelled, 'Cancelled');
});

test('Services lists the member bookings query and past section under open bookings', async () => {
  const hook = await src('src/features/services/useServices.ts');
  const page = await src('src/pages/services/ServicesElements.tsx');
  const list = await src('src/features/services/BookingsList.tsx');

  assert.match(hook, /export function useMyBookings/);
  assert.match(hook, /collection\(db, 'bookings'\)/);
  assert.match(hook, /where\('uid', '==', user\.uid\)/);
  assert.doesNotMatch(hook, /setDoc|updateDoc|addDoc/);
  assert.match(page, /useMyBookings/);
  assert.match(page, /<BookingsList items=\{bookings\}/);
  assert.match(list, /title="Open bookings"/);
  assert.match(list, /title="Past bookings"/);
  assert.match(list, /bookingStatusLabel\(booking\.status\)/);
});
