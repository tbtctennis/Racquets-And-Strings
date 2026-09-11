/**
 * Stripe Checkout session (test mode only). Hosted Checkout presents cards plus Google Pay
 * and Apple Pay as card wallets. The client receives {id, url} — never a key or card data.
 */
const { HttpsError } = require('firebase-functions/v2/https');
const { requireAuth, requireTrimmedString } = require('./callable');
const { PAYMENT_CURRENCY, assertNoCardData, seasonFromDate } = require('./payments');

const STRIPE_CHECKOUT_SESSIONS_URL = 'https://api.stripe.com/v1/checkout/sessions';
const CHECKOUT_PAYMENT_METHODS = Object.freeze(['card', 'google_pay', 'apple_pay']);
const MIN_DONATION_CENTS = 50;

const localHost = (host) => host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
const siteHost = (host) => host === 'www.racquetsandstrings.ca' || host === 'racquetsandstrings.ca';

function requireStripeTestSecret(secretKey) {
  if (typeof secretKey !== 'string' || !secretKey.startsWith('sk_test_')) {
    throw new HttpsError('failed-precondition', 'Stripe test-mode secret is required.');
  }
  return secretKey;
}

function readStripeSecret(secretParam) {
  if (typeof secretParam === 'string' && secretParam) return secretParam;
  if (secretParam && typeof secretParam.value === 'function') {
    try {
      const value = secretParam.value();
      if (typeof value === 'string' && value) return value;
    } catch {
      // Functions emulator has no bound secret; fall through to process.env.
    }
  }
  const fromEnv = process.env.STRIPE_SECRET_KEY;
  if (typeof fromEnv === 'string' && fromEnv) return fromEnv;
  throw new HttpsError('failed-precondition', 'Stripe test-mode key is not configured.');
}

function donationAmountToCents(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Donation amount must be a positive number.');
  }
  const cents = Math.round(amount * 100);
  if (cents < MIN_DONATION_CENTS) {
    throw new HttpsError('invalid-argument', 'Minimum donation is $0.50.');
  }
  return cents;
}

function assertCheckoutReturnUrl(value, field) {
  let url;
  try {
    url = new URL(requireTrimmedString(value, `${field} is required.`));
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('invalid-argument', `${field} must be a valid URL.`);
  }
  const host = url.hostname;
  const local = localHost(host);
  const site = siteHost(host);
  if (!local && !site) {
    throw new HttpsError('invalid-argument', `${field} origin is not allowed.`);
  }
  if (site && url.protocol !== 'https:') {
    throw new HttpsError('invalid-argument', `${field} origin is not allowed.`);
  }
  if (local && url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HttpsError('invalid-argument', `${field} origin is not allowed.`);
  }
  return url.toString();
}

function encodeStripeForm(params, prefix, parts = []) {
  if (params === undefined || params === null) return parts;
  if (Array.isArray(params)) {
    params.forEach((item, index) => encodeStripeForm(item, `${prefix}[${index}]`, parts));
    return parts;
  }
  if (typeof params === 'object') {
    for (const [key, value] of Object.entries(params)) {
      encodeStripeForm(value, prefix ? `${prefix}[${key}]` : key, parts);
    }
    return parts;
  }
  parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(params))}`);
  return parts;
}

function buildCheckoutSessionParams({ uid, userName, amountCents, type, season, successUrl, cancelUrl }) {
  if (type !== 'donation') {
    throw new HttpsError('invalid-argument', 'Only donations can start checkout.');
  }
  return {
    mode: 'payment',
    ui_mode: 'hosted',
    submit_type: 'donate',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: uid,
    // Card is the Stripe API type; Checkout presents Google Pay and Apple Pay as wallets on it.
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PAYMENT_CURRENCY,
          unit_amount: amountCents,
          product_data: {
            name: 'Support the league',
            description: `${season} donation`,
          },
        },
      },
    ],
    metadata: {
      uid,
      user_name: userName || '',
      type,
      season,
      amount: String(amountCents / 100),
      currency: PAYMENT_CURRENCY,
      payment_methods: CHECKOUT_PAYMENT_METHODS.join(','),
    },
    payment_intent_data: {
      metadata: {
        uid,
        type,
        season,
      },
    },
  };
}

function publicCheckoutSession(session) {
  if (!session || typeof session !== 'object') {
    throw new HttpsError('internal', 'Unable to start checkout.');
  }
  const { id, url } = session;
  if (typeof id !== 'string' || !id.startsWith('cs_test_')) {
    throw new HttpsError('failed-precondition', 'Stripe did not return a test-mode session.');
  }
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new HttpsError('internal', 'Unable to start checkout.');
  }
  return { id, url };
}

async function createStripeCheckoutSession(secretKey, params, fetchImpl = fetch) {
  requireStripeTestSecret(secretKey);
  const response = await fetchImpl(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeStripeForm(params).join('&'),
  });
  if (!response.ok) {
    throw new HttpsError('internal', 'Unable to start checkout.');
  }
  try {
    return publicCheckoutSession(await response.json());
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Unable to start checkout.');
  }
}

function refuseCardData(data) {
  try {
    assertNoCardData(data || {});
  } catch (error) {
    throw new HttpsError('invalid-argument', error.message);
  }
}

async function createCheckoutSession(request, deps = {}) {
  const uid = requireAuth(request);
  refuseCardData(request.data);
  const type = request.data?.type ?? 'donation';
  const amountCents = donationAmountToCents(request.data?.amount);
  const successUrl = assertCheckoutReturnUrl(request.data?.success_url, 'success_url');
  const cancelUrl = assertCheckoutReturnUrl(request.data?.cancel_url, 'cancel_url');
  const secretKey = requireStripeTestSecret(deps.getSecret ? deps.getSecret() : readStripeSecret());
  const now = deps.now ?? new Date();
  const season = seasonFromDate(now);
  const userName = deps.userName ?? (await (deps.loadUserName || (async () => ''))(uid));
  const params = buildCheckoutSessionParams({
    uid,
    userName,
    amountCents,
    type,
    season,
    successUrl,
    cancelUrl,
  });
  return createStripeCheckoutSession(secretKey, params, deps.fetch);
}

module.exports = {
  CHECKOUT_PAYMENT_METHODS,
  STRIPE_CHECKOUT_SESSIONS_URL,
  MIN_DONATION_CENTS,
  requireStripeTestSecret,
  readStripeSecret,
  donationAmountToCents,
  assertCheckoutReturnUrl,
  encodeStripeForm,
  buildCheckoutSessionParams,
  publicCheckoutSession,
  createStripeCheckoutSession,
  createCheckoutSession,
};
