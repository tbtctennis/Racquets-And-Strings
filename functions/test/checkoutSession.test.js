const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const {
  CHECKOUT_PAYMENT_METHODS,
  STRIPE_CHECKOUT_SESSIONS_URL,
  buildCheckoutSessionParams,
  createCheckoutSession,
  publicCheckoutSession,
  requireStripeTestSecret,
} = require('../lib/checkoutSession');

const memberRequest = {
  auth: { uid: 'member-a' },
  data: {
    amount: 25,
    success_url: 'http://localhost:3000/profile?donation=success',
    cancel_url: 'http://localhost:3000/profile?donation=cancel',
  },
};

test('checkout offers card, Google Pay, and Apple Pay on a server-built test-mode session', () => {
  assert.deepEqual([...CHECKOUT_PAYMENT_METHODS], ['card', 'google_pay', 'apple_pay']);
  const params = buildCheckoutSessionParams({
    uid: 'member-a',
    userName: 'Synthetic Member',
    amountCents: 2500,
    type: 'donation',
    season: 'summer',
    successUrl: memberRequest.data.success_url,
    cancelUrl: memberRequest.data.cancel_url,
  });
  assert.equal(params.mode, 'payment');
  assert.equal(params.ui_mode, 'hosted');
  assert.deepEqual(params.payment_method_types, ['card']);
  assert.equal(params.metadata.payment_methods, 'card,google_pay,apple_pay');
  assert.equal(params.metadata.currency, 'cad');
  assert.equal(params.line_items[0].price_data.currency, 'cad');
  assert.equal(params.line_items[0].price_data.unit_amount, 2500);
});

test('createCheckoutSession posts to Stripe with a test key and returns only id and url', async () => {
  let fetched;
  const result = await createCheckoutSession(memberRequest, {
    getSecret: () => 'sk_test_123',
    loadUserName: async () => 'Synthetic Member',
    now: new Date('2026-05-12T15:01:00.000Z'),
    fetch: async (url, init) => {
      fetched = { url, init };
      return {
        ok: true,
        json: async () => ({
          id: 'cs_test_session',
          url: 'https://checkout.stripe.com/c/pay/cs_test_session',
          client_secret: 'should-not-leak',
          secret: 'sk_test_123',
        }),
      };
    },
  });

  assert.deepEqual(result, {
    id: 'cs_test_session',
    url: 'https://checkout.stripe.com/c/pay/cs_test_session',
  });
  assert.equal(fetched.url, STRIPE_CHECKOUT_SESSIONS_URL);
  assert.equal(fetched.init.headers.Authorization, 'Bearer sk_test_123');
  assert.match(fetched.init.body, /payment_method_types%5B0%5D=card/);
  assert.match(fetched.init.body, /card%2Cgoogle_pay%2Capple_pay/);
  assert.equal(fetched.init.body.includes('sk_test_123'), false);
  assert.equal(JSON.stringify(result).includes('sk_'), false);
  assert.equal(JSON.stringify(result).includes('client_secret'), false);
});

test('live Stripe keys, live session ids, card data, and anonymous callers are refused', async () => {
  assert.throws(
    () => requireStripeTestSecret('sk_live_abc'),
    (error) => {
      assert.ok(error instanceof HttpsError);
      assert.equal(error.code, 'failed-precondition');
      return true;
    },
  );
  assert.throws(
    () => publicCheckoutSession({ id: 'cs_live_abc', url: 'https://checkout.stripe.com/c/pay/cs_live_abc' }),
    (error) => error instanceof HttpsError && error.code === 'failed-precondition',
  );

  let called = false;
  await assert.rejects(
    () =>
      createCheckoutSession(memberRequest, {
        getSecret: () => 'sk_live_abc',
        fetch: async () => {
          called = true;
          return { ok: true, json: async () => ({}) };
        },
      }),
    (error) => error instanceof HttpsError && error.code === 'failed-precondition',
  );
  assert.equal(called, false);

  await assert.rejects(
    () => createCheckoutSession({ auth: null, data: memberRequest.data }, { getSecret: () => 'sk_test_123' }),
    (error) => error instanceof HttpsError && error.code === 'unauthenticated',
  );

  await assert.rejects(
    () =>
      createCheckoutSession(
        { ...memberRequest, data: { ...memberRequest.data, card_number: '4242424242424242' } },
        { getSecret: () => 'sk_test_123' },
      ),
    (error) => error instanceof HttpsError && error.code === 'invalid-argument',
  );
});
