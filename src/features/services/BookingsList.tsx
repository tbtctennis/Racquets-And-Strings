import React from 'react';
import { ListGroup } from '../../components/ListGroup';
import { ListRow } from '../../components/ListRow';
import { Pill } from '../../components/Pill';
import { bookingStatusLabel, partitionBookings } from './bookingList';
import type { Booking, BookingStatus } from './types';

const PILL_TONE: Record<BookingStatus, React.ComponentProps<typeof Pill>['tone']> = {
  lead: 'accent',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

function bookingTitle(booking: Booking, titles?: Record<string, string>): string {
  return titles?.[booking.service_id] || titles?.[booking.id] || 'Service booking';
}

export const BookingsList: React.FC<{
  items: Booking[];
  titles?: Record<string, string> | undefined;
}> = ({ items, titles }) => {
  const { open, past } = partitionBookings(items);
  if (open.length === 0 && past.length === 0) return null;

  const row = (booking: Booking) => (
    <ListRow
      key={booking.id}
      title={bookingTitle(booking, titles)}
      trailing={<Pill tone={PILL_TONE[booking.status]}>{bookingStatusLabel(booking.status)}</Pill>}
    />
  );

  return (
    <div className="mb-5 space-y-4">
      {open.length > 0 ? (
        <ListGroup title="Open bookings" className="rounded-3xl" labelledBy="open-bookings-list">
          {open.map(row)}
        </ListGroup>
      ) : null}
      {past.length > 0 ? (
        <ListGroup title="Past bookings" className="rounded-3xl" labelledBy="past-bookings-list">
          {past.map(row)}
        </ListGroup>
      ) : null}
    </div>
  );
};
