// Services = things members can spend points on, or just browse and book at regular price.
export type ServiceCategory = 'stringing' | 'coaching' | 'others';

export type ProviderRole = 'stringer' | 'coach' | 'other';

export interface ProviderRecord {
  id: string;
  name: string;
  roles: ProviderRole[];
  member_uid?: string | undefined;
  area?: string | undefined;
  updated_at?: string | undefined;
}

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  stringing: 'Stringing',
  coaching: 'Coaches',
  others: 'Others',
};

// Collection: services — the Services catalog. Existing task offer documents remain a
// read-only compatibility source until the authorized data migration is complete. Service doc
// ids must stay stable because issued coupons store them in redemptions.reward_id.
export interface Reward {
  id: string;
  category: ServiceCategory;
  /** Groups services under one provider row. */
  provider_id: string;
  provider_name: string;
  /**
   * The provider's own account, so their profile photo can be shown beside their name. Optional:
   * a provider who isn't a member (or hasn't been linked yet) simply falls back to an initial.
   * Without it the only way to resolve provider_id → uid is a full scan of `preferences`.
   */
  uid?: string | undefined;
  contact_phone?: string | undefined;
  contact_email?: string | undefined;
  area: string;
  offer: string;
  /** Free text, e.g. "Head, Kirschbaum, MSV" — rendered as chips. Blank for coaching. */
  brands?: string | undefined;
  discount: number;
  total_price: number;
  discounted_price: number;
  points_cost: number;
  /** Coaching only — shown as a credential badge on the provider row. */
  certified?: boolean | undefined;
  active?: boolean | undefined;
  sort?: number | undefined;
}

export type RedemptionStatus =
  | 'active' // coupon issued, not yet used
  | 'used' // provider or organizer burned it
  | 'flagged' // provider raised a problem — organizer decides
  | 'cancel_requested' // player asked to undo it — organizer decides
  | 'cancelled'; // undone, points refunded

// Collection: redemptions — doc id IS the coupon code, which is what makes codes unique.
// Written only by the Cloud Functions in functions/rewards.js; read-only to everyone else.
export interface Redemption {
  code: string;
  reward_id: string;
  /** Legacy field name on existing docs; holds the provider id for both categories. */
  stringer_id: string;
  stringer_name: string;
  offer: string;
  discounted_price: number | null;
  points_cost: number;
  uid: string;
  user_name: string;
  status: RedemptionStatus;
  created_at: string;
  used_at?: string | undefined;
  used_by?: string | undefined;
  flagged_at?: string | undefined;
  flag_note?: string | undefined;
  cancel_requested_at?: string | undefined;
  cancel_reason?: string | undefined;
  cancelled_at?: string | undefined;
  reviewer_note?: string | undefined;
}

// A coupon still in play — the player can't redeem the same offer again, and the provider
// still sees it on their list.
export const OPEN_STATUSES: RedemptionStatus[] = ['active', 'flagged', 'cancel_requested'];

export type BookingStatus = 'lead' | 'in_progress' | 'completed' | 'cancelled';

export const OPEN_BOOKING_STATUSES: BookingStatus[] = ['lead', 'in_progress'];
export const PAST_BOOKING_STATUSES: BookingStatus[] = ['completed', 'cancelled'];

export interface Booking {
  id: string;
  service_id: string;
  provider_id: string;
  uid: string;
  user_name: string;
  status: BookingStatus;
  note?: string | undefined;
  created_at: string;
  updated_at: string;
  marked_completed_at?: string | undefined;
  completed_at?: string | undefined;
  cancelled_at?: string | undefined;
}

/** Cheapest thing in the catalog — drives the "unlock a reward" threshold across the app. */
export const MIN_REWARD_COST = 15;
