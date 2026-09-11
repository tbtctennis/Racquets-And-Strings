/**
 * Stripe test-mode webhook helpers. checkout.session.completed stamps payments/{sessionId}
 * through buildPaymentRecord. Replay is create-if-absent. Live-mode events are rejected.
 * No card data. Signature uses the raw body; parsed JSON is not signed.
 */

const nodeCrypto = require('node:crypto');
const { PAYMENTS_COLLECTION, buildPaymentRecord } = require('./payments');

const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;
const CHECKOUT_COMPLETED = 'checkout.session.completed';

const asBuffer = (rawBody) => {
  if (Buffer.isBuffer(rawBody)) return rawBody;
  if (typeof rawBody === 'string') return Buffer.from(rawBody, 'utf8');
  throw new Error('Missing Stripe payload');
};

const headerValue = (value) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const parseStripeSignatureHeader = (header) => {
  const raw = headerValue(header);
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('Missing Stripe-Signature');
  }

  const timestamps = [];
  const signatures = [];
  for (const item of raw.split(',')) {
    const [key, ...rest] = item.trim().split('=');
    const value = rest.join('=');
    if (key === 't') timestamps.push(value);
    if (key === 'v1') signatures.push(value);
  }
  if (!timestamps[0] || signatures.length === 0) {
    throw new Error('Invalid Stripe-Signature');
  }
  return { timestamp: timestamps[0], signatures };
};

const verifyStripeSignature = (rawBody, header, secret, nowMs = Date.now()) => {
  if (typeof secret !== 'string' || !secret) {
    throw new Error('Missing Stripe webhook secret');
  }

  const payload = asBuffer(rawBody);
  const { timestamp, signatures } = parseStripeSignatureHeader(header);
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Math.floor(nowMs / 1000) - ts) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
    throw new Error('Stripe-Signature timestamp rejected');
  }

  const expected = nodeCrypto
    .createHmac('sha256', secret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), payload]))
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const valid = signatures.some((signature) => {
    try {
      const got = Buffer.from(signature, 'hex');
      return got.length === expectedBuf.length && nodeCrypto.timingSafeEqual(got, expectedBuf);
    } catch {
      return false;
    }
  });
  if (!valid) throw new Error('Invalid Stripe-Signature');

  let event;
  try {
    event = JSON.parse(payload.toString('utf8'));
  } catch {
    throw new Error('Invalid Stripe payload');
  }
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new Error('Invalid Stripe payload');
  }
  return event;
};

const centsToMajor = (amountTotal) => {
  if (typeof amountTotal !== 'number' || !Number.isFinite(amountTotal) || amountTotal <= 0) {
    throw new Error('Payment amount must be a positive number in major units');
  }
  return amountTotal / 100;
};

const paymentIntentId = (session) => {
  const intent = session && session.payment_intent;
  if (typeof intent === 'string' && intent.trim()) return intent.trim();
  if (intent && typeof intent === 'object' && typeof intent.id === 'string' && intent.id.trim()) {
    return intent.id.trim();
  }
  throw new Error('Payment stripe_payment_intent_id is required');
};

const sessionMetadata = (session) =>
  session && typeof session.metadata === 'object' && session.metadata ? session.metadata : {};

const isoFromUnix = (value, fallbackMs) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return new Date(value * 1000).toISOString();
  }
  return new Date(fallbackMs).toISOString();
};

const paymentFromCheckoutSession = (session, { userName, paidAt } = {}) => {
  if (!session || session.object !== 'checkout.session' || typeof session.id !== 'string' || !session.id.trim()) {
    throw new Error('Expected a Stripe Checkout session');
  }

  const metadata = sessionMetadata(session);
  const uid = String(metadata.uid || session.client_reference_id || '').trim();
  const type = String(metadata.type || 'donation').trim();
  const name = String(userName || metadata.user_name || '').trim();

  return buildPaymentRecord({
    id: session.id.trim(),
    uid,
    user_name: name,
    type,
    amount: centsToMajor(session.amount_total),
    currency: String(session.currency || '').toLowerCase(),
    stripe_checkout_session_id: session.id.trim(),
    stripe_payment_intent_id: paymentIntentId(session),
    created_at: paidAt,
    paid_at: paidAt,
  });
};

const isAlreadyExists = (error) => {
  const code = error && error.code;
  return code === 6 || code === 'already-exists' || code === 'ALREADY_EXISTS';
};

const firestorePaymentStore = (db) => ({
  async lookupUserName(uid) {
    if (!uid) return '';
    const snap = await db.doc(`users/${uid}`).get();
    const name = snap.exists ? snap.data().name : '';
    return typeof name === 'string' ? name.trim() : '';
  },
  async createPayment(record) {
    try {
      await db.collection(PAYMENTS_COLLECTION).doc(record.id).create(record);
      return true;
    } catch (error) {
      if (isAlreadyExists(error)) return false;
      throw error;
    }
  },
});

const recordCheckoutPayment = async (event, store, nowMs = Date.now()) => {
  if (!event || event.livemode !== false) {
    throw new Error('Live Stripe events are rejected; test mode only');
  }
  if (event.type !== CHECKOUT_COMPLETED) {
    return { ignored: true, replayed: false, record: null };
  }

  const session = event.data && event.data.object;
  if (!session || session.payment_status !== 'paid') {
    return { ignored: true, replayed: false, record: null };
  }

  const metadata = sessionMetadata(session);
  const uid = String(metadata.uid || session.client_reference_id || '').trim();
  let userName = String(metadata.user_name || '').trim();
  if (!userName && store && typeof store.lookupUserName === 'function') {
    userName = String((await store.lookupUserName(uid)) || '').trim();
  }

  const paidAt = isoFromUnix(event.created, nowMs);
  const record = paymentFromCheckoutSession(session, { userName, paidAt });
  const wrote = await store.createPayment(record);
  return { ignored: false, replayed: wrote === false, record };
};

const processStripeWebhook = async ({ rawBody, signature, secret, store, nowMs = Date.now() }) => {
  const event = verifyStripeSignature(rawBody, signature, secret, nowMs);
  const result = await recordCheckoutPayment(event, store, nowMs);
  return {
    status: 200,
    body: { received: true, ignored: Boolean(result.ignored), replayed: Boolean(result.replayed) },
    result,
  };
};

module.exports = {
  STRIPE_SIGNATURE_TOLERANCE_SECONDS,
  CHECKOUT_COMPLETED,
  verifyStripeSignature,
  firestorePaymentStore,
  recordCheckoutPayment,
  processStripeWebhook,
};
