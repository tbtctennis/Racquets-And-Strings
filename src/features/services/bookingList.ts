import { OPEN_BOOKING_STATUSES, PAST_BOOKING_STATUSES, type Booking, type BookingStatus } from './types';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  lead: 'Booked',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function isOpenBooking(booking: Booking): boolean {
  return OPEN_BOOKING_STATUSES.includes(booking.status);
}

export function isPastBooking(booking: Booking): boolean {
  return PAST_BOOKING_STATUSES.includes(booking.status);
}

export function bookingStatusLabel(status: BookingStatus): string {
  return BOOKING_STATUS_LABEL[status];
}

function bookingSortKey(booking: Booking): string {
  if (booking.status === 'completed') return booking.completed_at || booking.updated_at || booking.created_at || '';
  if (booking.status === 'cancelled') return booking.cancelled_at || booking.updated_at || booking.created_at || '';
  return booking.created_at || booking.updated_at || '';
}

function compareBookings(a: Booking, b: Booking): number {
  const byTime = bookingSortKey(b).localeCompare(bookingSortKey(a));
  if (byTime !== 0) return byTime;
  return (b.id || '').localeCompare(a.id || '');
}

/** Open jobs first (lead, in_progress), then completed and cancelled. Newest first, id as tie-break. */
export function partitionBookings(bookings: Booking[]): { open: Booking[]; past: Booking[] } {
  return {
    open: bookings.filter(isOpenBooking).sort(compareBookings),
    past: bookings.filter(isPastBooking).sort(compareBookings),
  };
}
