import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { PAYMENT_FIELDS, assertNoCardData } from '../../src/features/payments/paymentDocument.ts';
import { NEW_SHAPE_FIXTURES } from '../fixtures/local-fixtures.mjs';
import { SHAPE_REFERENCE } from '../fixtures/shape-reference.mjs';

const require = createRequire(import.meta.url);
const { PAYMENT_FIELDS: SERVER_PAYMENT_FIELDS } = require('../../functions/lib/payments.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = (relative) => readFile(path.join(ROOT, relative), 'utf8');
const rel = (file) => path.relative(ROOT, file).replaceAll('\\', '/');

const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage']);
const CARD_FIELD =
  /^(card_number|cardNumber|card_cvc|card_cvv|cvc|cvv|pan|exp_month|exp_year|expiry|expiration|last4|last_4)$/i;
const CARD_SOURCE = /\b(card_number|cardNumber|card_cvc|card_cvv|exp_month|exp_year)\b/;
const VITE_STRIPE_NAME = /\bVITE_[A-Z0-9_]*STRIPE[A-Z0-9_]*\b/i;
const STRIPE_KEY_MATERIAL = /\b(?:sk|pk|rk)_(?:live|test)_|whsec_/;
const SERVER_SECRET_NAME = /\bSTRIPE_(?:SECRET_KEY|WEBHOOK_SECRET|PUBLISHABLE_KEY)\b/;
const ENV_SECRET_ASSIGNMENT =
  /^(?:export\s+)?(VITE_[A-Z0-9_]*STRIPE[A-Z0-9_]*|STRIPE_(?:SECRET_KEY|WEBHOOK_SECRET|PUBLISHABLE_KEY))\s*=/im;

async function filesUnder(directory, predicate) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(full, predicate)));
    else if (entry.isFile() && predicate(entry.name, full)) files.push(full);
  }
  return files;
}

const isClientSource = (name) => /\.(tsx?|jsx?|mjs|css|html)$/.test(name);
const isEnvFile = (name) => name === '.env' || name.startsWith('.env.');
const isScript = (name) => /\.mjs$/.test(name);
const isBundle = (name) => /\.(js|mjs|css|html|map)$/.test(name);

async function collectHits(files, patterns) {
  const hits = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const pattern of patterns) {
      if (pattern.test(source)) hits.push(`${rel(file)} ${pattern}`);
      pattern.lastIndex = 0;
    }
  }
  return hits;
}

test('no Stripe key appears in any VITE_ variable or the client source that becomes the bundle', async () => {
  const envFiles = (await readdir(ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && isEnvFile(entry.name))
    .map((entry) => path.join(ROOT, entry.name));
  const clientFiles = await filesUnder(path.join(ROOT, 'src'), isClientSource);
  const scriptFiles = await filesUnder(path.join(ROOT, 'scripts'), isScript);
  const extras = ['index.html', 'vite.config.ts'].map((name) => path.join(ROOT, name));
  const bundleFiles = await filesUnder(path.join(ROOT, 'dist'), isBundle);

  const envHits = [];
  for (const file of envFiles) {
    const source = await readFile(file, 'utf8');
    const assignment = source.match(ENV_SECRET_ASSIGNMENT);
    if (assignment) envHits.push(`${rel(file)} assigns ${assignment[1]}`);
  }
  assert.deepEqual(envHits, [], `Stripe secret assigned in a Vite-loaded env file: ${envHits.join(', ')}`);

  const clientHits = await collectHits(
    [...clientFiles, ...extras],
    [VITE_STRIPE_NAME, STRIPE_KEY_MATERIAL, SERVER_SECRET_NAME],
  );
  assert.deepEqual(clientHits, [], `Stripe key leaked into client source: ${clientHits.join(', ')}`);

  const scriptHits = await collectHits(scriptFiles, [VITE_STRIPE_NAME]);
  assert.deepEqual(scriptHits, [], `VITE_ Stripe key injected by a script: ${scriptHits.join(', ')}`);

  const bundleHits = await collectHits(bundleFiles, [VITE_STRIPE_NAME, STRIPE_KEY_MATERIAL, SERVER_SECRET_NAME]);
  assert.deepEqual(bundleHits, [], `Stripe key leaked into the client bundle: ${bundleHits.join(', ')}`);

  const checkout = await src('src/features/payments/checkoutSession.ts');
  assert.match(checkout, /export type CheckoutSessionResult = \{/);
  assert.match(checkout, /id: string;/);
  assert.match(checkout, /url: string;/);
  assert.doesNotMatch(checkout, /client_secret|secret_key|sk_|pk_|whsec_/);
});

test('payment documents store no card data', async () => {
  assert.ok(!PAYMENT_FIELDS.some((field) => CARD_FIELD.test(field)));
  assert.ok(!SERVER_PAYMENT_FIELDS.some((field) => CARD_FIELD.test(field)));
  assert.deepEqual([...PAYMENT_FIELDS], [...SERVER_PAYMENT_FIELDS]);

  const shapeKeys = Object.keys(SHAPE_REFERENCE.payments);
  assert.ok(!shapeKeys.some((field) => CARD_FIELD.test(field)));
  assert.ok(shapeKeys.includes('stripe_payment_intent_id'));
  assert.ok(!shapeKeys.includes('card_number'));

  const paymentDocs = NEW_SHAPE_FIXTURES.filter(({ path }) => path.startsWith('payments/'));
  assert.ok(paymentDocs.length >= 4, 'fixture set must cover donation, request, refund, and court booking');
  for (const { path, data } of paymentDocs) {
    assert.doesNotThrow(() => assertNoCardData(data), `${path} carries card data`);
    for (const key of Object.keys(data)) {
      assert.equal(CARD_FIELD.test(key), false, `${path} field ${key}`);
    }
  }

  const paymentsSection = (await src('docs/architecture/DATA_SHAPE.md')).split('### 4.12')[1]?.split('## 5.')[0] ?? '';
  assert.match(paymentsSection, /No\s+card data/);
  assert.doesNotMatch(paymentsSection, CARD_SOURCE);

  const rules = await src('firestore.rules');
  assert.match(rules, /match \/payments\/\{paymentId\}/);
  assert.match(rules, /No card data is stored/);

  const paymentSources = await filesUnder(path.join(ROOT, 'src/features/payments'), isClientSource);
  const cardHits = await collectHits(paymentSources, [CARD_SOURCE]);
  assert.deepEqual(cardHits, [], `card fields in the payments client: ${cardHits.join(', ')}`);
});

test('the Stripe webhook secret is a server-only Firebase secret', async () => {
  const webhook = await src('functions/paymentsWebhook.js');
  assert.match(webhook, /const stripeWebhookSecret = defineSecret\('STRIPE_WEBHOOK_SECRET'\)/);
  assert.match(webhook, /secrets: \[stripeWebhookSecret\]/);
  assert.match(webhook, /secret: stripeWebhookSecret\.value\(\)/);
  assert.doesNotMatch(webhook, /VITE_/);
  assert.doesNotMatch(webhook, /import\.meta\.env/);

  const checkout = await src('functions/payments.js');
  assert.match(checkout, /const stripeSecretKey = defineSecret\('STRIPE_SECRET_KEY'\)/);
  assert.doesNotMatch(checkout, /STRIPE_WEBHOOK_SECRET/);
  assert.doesNotMatch(checkout, /VITE_/);

  const clientFiles = await filesUnder(path.join(ROOT, 'src'), isClientSource);
  const clientHits = await collectHits(clientFiles, [SERVER_SECRET_NAME, /\bwhsec_/, /\bdefineSecret\b/]);
  assert.deepEqual(clientHits, [], `webhook secret reached the client: ${clientHits.join(', ')}`);

  const envExample = await src('.env.example');
  assert.match(envExample, /Do not place RESEND_API_KEY, STRIPE_SECRET_KEY/);
  assert.doesNotMatch(envExample, ENV_SECRET_ASSIGNMENT);
});
