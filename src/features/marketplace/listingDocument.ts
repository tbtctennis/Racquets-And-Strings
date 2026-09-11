import type { ContactData, ContactMethod } from '../../types';

// Member-posted equipment listings — the Rent and Buy/Sell tabs of the Marketplace.
// Contact for a listing is listing-mediated: the client writes `listings/{id}` and buyers
// read `public_contacts/{uid}`, never private `contacts/{uid}`.
export type ListingKind = 'rent' | 'sell';

export type ListingCondition = 'New' | 'Like new' | 'Good' | 'Fair';
export const CONDITIONS: ListingCondition[] = ['New', 'Like new', 'Good', 'Fair'];

/** Available until the poster marks it gone. Sold/rented listings drop to the bottom, greyed. */
export type ListingStatus = 'available' | 'sold' | 'rented';

export const STATUS_LABEL: Record<ListingStatus, string> = {
  available: 'Available',
  sold: 'Sold',
  rented: 'Rented out',
};

export interface Listing {
  id: string;
  kind: ListingKind;
  title: string;
  description: string;
  condition: ListingCondition;
  price: number;
  /** Where the buyer collects it. Free text — "Enter Location" in the form. */
  pickup: string;
  /** Rent only: how long the price covers, e.g. "2 weeks". The poster sets the terms. */
  duration?: string;
  /** Storage paths; resolved to download URLs for display. Up to MAX_LISTING_PHOTOS. */
  photo_paths: string[];
  status: ListingStatus;
  uid: string;
  user_name: string;
  created_at: string;
  updated_at?: string;
}

export interface ListingDraft {
  kind: ListingKind;
  title: string;
  description: string;
  condition: Listing['condition'];
  price: string;
  pickup: string;
  duration: string;
  files: File[];
}

export const emptyDraft = (kind: ListingKind): ListingDraft => ({
  kind,
  title: '',
  description: '',
  condition: 'Good',
  price: '',
  pickup: '',
  duration: '',
  files: [],
});

/** Client-writable listing fields. Contact channels are not in this set. */
export const LISTING_FIELDS = [
  'kind',
  'title',
  'description',
  'condition',
  'price',
  'pickup',
  'duration',
  'photo_paths',
  'status',
  'uid',
  'user_name',
  'created_at',
  'updated_at',
] as const;

export const LISTINGS_COLLECTION = 'listings';
export const LISTING_CONTACT_COLLECTION = 'public_contacts';

const LISTING_CONTACT_METHODS = new Set<string>(['email', 'text', 'whatsapp']);

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown): UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {};

/** Builds the `listings` document. Never copies phone, email, or other contact channels. */
export function buildListingDocument(
  uid: string,
  userName: string,
  draft: ListingDraft,
  photoPaths: string[],
  createdAt: string,
): Omit<Listing, 'id'> {
  return {
    kind: draft.kind,
    title: draft.title.trim(),
    description: draft.description.trim(),
    condition: draft.condition,
    price: Number(draft.price),
    pickup: draft.pickup.trim(),
    ...(draft.kind === 'rent' ? { duration: draft.duration.trim() } : {}),
    photo_paths: photoPaths,
    status: 'available',
    uid,
    user_name: userName,
    created_at: createdAt,
  };
}

/**
 * Allowlisted projection from `public_contacts/{uid}`. Drops private account fields such as
 * `secondary_email` even if a document smuggles them.
 */
export function normalizeListingContact(value: unknown): ContactData | undefined {
  const data = record(value);
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  const whatsapp = typeof data.whatsapp_contact === 'string' ? data.whatsapp_contact.trim() : '';
  if (!email && !phone && !whatsapp) return undefined;

  const preferredRaw = data.preferred_mode_of_contact;
  const preferred = Array.isArray(preferredRaw)
    ? preferredRaw.filter(
        (method): method is ContactMethod => typeof method === 'string' && LISTING_CONTACT_METHODS.has(method),
      )
    : typeof preferredRaw === 'string' && LISTING_CONTACT_METHODS.has(preferredRaw)
      ? [preferredRaw as ContactMethod]
      : [];

  return {
    email,
    phone,
    ...(preferred.length ? { preferred_mode_of_contact: preferred } : {}),
    ...(whatsapp ? { whatsapp_contact: whatsapp } : {}),
    ...(data.whatsapp_same_as_phone === true ? { whatsapp_same_as_phone: true } : {}),
    contactable: data.contactable !== false,
  };
}

/** "$40 for 2 weeks" for rentals, plain "$40" for sales. */
export const formatListingPrice = (l: Pick<Listing, 'kind' | 'price' | 'duration'>): string => {
  const amount = `$${l.price % 1 === 0 ? l.price : l.price.toFixed(2)}`;
  return l.kind === 'rent' && l.duration?.trim() ? `${amount} for ${l.duration.trim()}` : amount;
};
