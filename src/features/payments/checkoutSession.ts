import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

export type CheckoutSessionRequest = {
  amount: number;
  success_url: string;
  cancel_url: string;
  type?: 'donation';
};

export type CheckoutSessionResult = {
  id: string;
  url: string;
};

const call = <T, R>(name: string) => {
  const fn = httpsCallable<T, R>(functions, name);
  return async (payload: T): Promise<R> => (await fn(payload)).data;
};

/** Server-created Stripe Checkout session. The client receives only the hosted URL — never a key. */
export const createCheckoutSession = call<CheckoutSessionRequest, CheckoutSessionResult>('createCheckoutSession');
