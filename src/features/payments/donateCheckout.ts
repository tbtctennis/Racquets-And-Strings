import { seasonFromDate } from './paymentDocument';

export const CAMPAIGN_COPY =
  'to help us organize more events, provide new tennis balls for matches, get better prizes for winners, and an end of season awards ceremony';

export const DEFAULT_DONATION_AMOUNT = 25;
export const MIN_DONATION_AMOUNT = 0.5;

export type DonationCheckoutRequest = {
  amount: number;
  success_url: string;
  cancel_url: string;
  type: 'donation';
};

export type DonationCheckoutResult = {
  id: string;
  url: string;
};

/** Return URLs Stripe sends the member back to after hosted Checkout. */
export function donationCheckoutUrls(origin: string): Pick<DonationCheckoutRequest, 'success_url' | 'cancel_url'> {
  return {
    success_url: `${origin}/profile?donation=success`,
    cancel_url: `${origin}/profile?donation=cancel`,
  };
}

export function currentSeasonName(now: Date | string = new Date()): 'Summer' | 'Winter' {
  return seasonFromDate(now) === 'summer' ? 'Summer' : 'Winter';
}

export function parseDonationAmount(value: string): number | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < MIN_DONATION_AMOUNT) return null;
  return amount;
}

/** Creates a test-mode Checkout session and hands the browser to Stripe's hosted URL. */
export async function startDonationCheckout({
  amount,
  origin,
  createSession,
  assign,
}: {
  amount: number;
  origin: string;
  createSession: (request: DonationCheckoutRequest) => Promise<DonationCheckoutResult>;
  assign: (url: string) => void;
}): Promise<void> {
  if (!Number.isFinite(amount) || amount < MIN_DONATION_AMOUNT) {
    throw new Error('Minimum donation is $0.50.');
  }
  const session = await createSession({
    amount,
    type: 'donation',
    ...donationCheckoutUrls(origin),
  });
  if (!session.url.startsWith('https://')) {
    throw new Error('Unable to start checkout.');
  }
  assign(session.url);
}
