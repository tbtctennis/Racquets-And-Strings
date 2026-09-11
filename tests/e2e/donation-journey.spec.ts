import { expect, test, type Page } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * TASK-619 / D9-V-T1 — donate → webhook → payment row → badge, against the emulator.
 *
 * Hosted Stripe Checkout (cards / Google Pay / Apple Pay) is not driven in this
 * browser. That still needs Functions secrets `STRIPE_SECRET_KEY=sk_test_…` and
 * `STRIPE_WEBHOOK_SECRET=whsec_…` (never a `VITE_` variable) plus Stripe CLI
 * forwarding or a test-mode webhook endpoint. Continue-to-checkout would call
 * `api.stripe.com` with that test key. This journey mocks Checkout, signs a
 * test-mode `checkout.session.completed` event, writes through the webhook
 * helper into emulator Firestore, and asserts the Contributor badge.
 */

const evidenceDir = process.env.RANDS_E2E_EVIDENCE_DIR;
const capture = async (page: Page, name: string) => {
  if (!evidenceDir) return;
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: true });
};

const login = async (page: Page, email: string, password: string) => {
  await page.goto('/login');
  await page.getByPlaceholder('roger@hotmail.com').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(email)).toBeVisible();
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/profile$/);
};

const WEBHOOK_SECRET = 'whsec_test_task_619';
const NOW_MS = Date.parse('2026-09-11T16:00:00.000Z');
const TIMESTAMP = Math.floor(NOW_MS / 1000);
const requireFromFunctions = createRequire(new URL('../../functions/package.json', import.meta.url));

type CheckoutSessionResult = { id: string; url: string };
type PaymentRecord = {
  id: string;
  uid: string;
  type: string;
  amount: number;
  currency: string;
  season: string;
  state: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string;
};
type CheckoutSessionLib = {
  createCheckoutSession: (
    request: { auth: { uid: string }; data: Record<string, unknown> },
    deps: {
      getSecret: () => string;
      loadUserName: () => Promise<string>;
      now: Date;
      fetch: (
        url: string,
        init: { headers: Record<string, string>; body: string },
      ) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
    },
  ) => Promise<CheckoutSessionResult>;
};
type StripeWebhookLib = {
  firestorePaymentStore: (db: Firestore) => {
    lookupUserName: (uid: string) => Promise<string>;
    createPayment: (record: PaymentRecord) => Promise<boolean>;
  };
  processStripeWebhook: (args: {
    rawBody: string;
    signature: string;
    secret: string;
    store: {
      lookupUserName: (uid: string) => Promise<string>;
      createPayment: (record: PaymentRecord) => Promise<boolean>;
    };
    nowMs: number;
  }) => Promise<{ status: number; body: { replayed: boolean }; result: { record: PaymentRecord | null } }>;
};
type PaymentsLib = {
  hasContributorBadge: (payments: Array<{ type: string; state: string }>) => boolean;
};

const { createCheckoutSession } = requireFromFunctions('./lib/checkoutSession.js') as CheckoutSessionLib;
const { firestorePaymentStore, processStripeWebhook } = requireFromFunctions(
  './lib/stripeWebhook.js',
) as StripeWebhookLib;
const { hasContributorBadge } = requireFromFunctions('./lib/payments.js') as PaymentsLib;

const sign = (payload: unknown) => {
  const body = JSON.stringify(payload);
  const hmac = createHmac('sha256', WEBHOOK_SECRET).update(`${TIMESTAMP}.${body}`).digest('hex');
  return { header: `t=${TIMESTAMP},v1=${hmac}`, rawBody: body };
};

const requireLocalEmulator = () => {
  const firestore = process.env.FIRESTORE_EMULATOR_HOST;
  const auth = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!firestore || !/^(localhost|127\.0\.0\.1):\d+$/.test(firestore)) {
    throw new Error('Donation journey tests may write payments only through the local emulator.');
  }
  if (!auth || !/^(localhost|127\.0\.0\.1):\d+$/.test(auth)) {
    throw new Error('Donation journey tests may read Auth only through the local emulator.');
  }
};

const emulatorDb = (): Firestore => {
  requireLocalEmulator();
  const existing = getApps().find((app) => app.name === 'donation-journey');
  const app = existing ?? initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'rands-local' }, 'donation-journey');
  return getFirestore(app);
};

const donateViaTestModeWebhook = async ({
  uid,
  userName,
  sessionId,
}: {
  uid: string;
  userName: string;
  sessionId: string;
}): Promise<PaymentRecord> => {
  const db = emulatorDb();
  const session = await createCheckoutSession(
    {
      auth: { uid },
      data: {
        amount: 25,
        type: 'donation',
        success_url: 'http://127.0.0.1:5000/profile?donation=success',
        cancel_url: 'http://127.0.0.1:5000/profile?donation=cancel',
      },
    },
    {
      getSecret: () => 'sk_test_task_619',
      loadUserName: async () => userName,
      now: new Date(NOW_MS),
      fetch: async (_url, init) => {
        expect(init.headers.Authorization).toMatch(/^Bearer sk_test_/);
        expect(init.body.includes('sk_live')).toBe(false);
        return {
          ok: true,
          json: async () => ({
            id: sessionId,
            url: `https://checkout.stripe.com/c/pay/${sessionId}`,
          }),
        };
      },
    },
  );
  expect(session.id).toBe(sessionId);

  const event = {
    id: `evt_${sessionId}`,
    object: 'event',
    type: 'checkout.session.completed',
    livemode: false,
    created: TIMESTAMP,
    data: {
      object: {
        id: session.id,
        object: 'checkout.session',
        payment_intent: `pi_${sessionId}`,
        payment_status: 'paid',
        amount_total: 2500,
        currency: 'cad',
        metadata: { uid, user_name: userName, type: 'donation' },
      },
    },
  };
  const { header, rawBody } = sign(event);
  const outcome = await processStripeWebhook({
    rawBody,
    signature: header,
    secret: WEBHOOK_SECRET,
    store: firestorePaymentStore(db),
    nowMs: NOW_MS,
  });
  expect(outcome.status).toBe(200);
  expect(outcome.body.replayed).toBe(false);
  const record = outcome.result.record;
  expect(record).toBeTruthy();
  expect(hasContributorBadge([record as PaymentRecord])).toBe(true);
  return record as PaymentRecord;
};

test('seeded donor shows the Contributor badge derived from the payment record', async ({ page }) => {
  await login(page, 'member-a@example.invalid', 'local-member-a-123!');
  await expect(page.getByRole('button', { name: 'Support the league' })).toBeVisible();
  await expect(page.getByTitle('An unrefunded donation')).toHaveText('Contributor');
  await capture(page, '09-seeded-donor-badge');
});

test('donation journey: donate surface, webhook record, Contributor badge', async ({ page }) => {
  // opponent-a has only a refunded donation fixture, so the badge is off until this webhook.
  const uid = 'opponent-a';
  const userName = 'Synthetic Opponent';
  const sessionId = `cs_test_journey_${Date.now()}`;

  await login(page, 'opponent-a@example.invalid', 'local-opponent-a-123!');
  await expect(page.getByRole('button', { name: 'Support the league' })).toBeVisible();
  await expect(page.getByTitle('An unrefunded donation')).toHaveCount(0);

  await page.getByRole('button', { name: 'Support the league' }).click();
  const donate = page.getByRole('dialog', { name: 'Support the league' });
  await expect(donate).toBeVisible();
  await expect(donate).toContainText(
    'to help us organize more events, provide new tennis balls for matches, get better prizes for winners, and an end of season awards ceremony',
  );
  await expect(donate).toContainText(/This is the (Summer|Winter) campaign/);
  await expect(donate.getByLabel('Amount')).toHaveValue('25');
  await expect(donate.getByRole('button', { name: 'Continue to checkout' })).toBeVisible();
  await capture(page, '10-donate-surface');
  await donate.getByRole('button', { name: 'Close' }).click();
  await expect(donate).toHaveCount(0);

  const record = await donateViaTestModeWebhook({ uid, userName, sessionId });
  expect(record.uid).toBe(uid);
  expect(record.type).toBe('donation');
  expect(record.state).toBe('succeeded');
  expect(record.stripe_checkout_session_id).toBe(sessionId);
  expect(Object.hasOwn(record, 'card_number')).toBe(false);

  const snap = await emulatorDb().doc(`payments/${sessionId}`).get();
  expect(snap.exists).toBe(true);
  expect(snap.data()?.state).toBe('succeeded');
  expect(snap.data()?.uid).toBe(uid);

  await expect(page.getByTitle('An unrefunded donation')).toHaveText('Contributor', { timeout: 15_000 });
  await capture(page, '11-donation-badge-after-webhook');
});
