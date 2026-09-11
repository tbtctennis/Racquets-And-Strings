/**
 * TASK-659 — unauthenticated, unauthorized, malformed, duplicate, and valid-path
 * coverage for every sensitive callable.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, beforeEach, test } from 'node:test';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const requireFromFunctions = createRequire(new URL('../../functions/package.json', import.meta.url));
const { SUPER_ADMIN_UID } = requireFromFunctions('./lib/constants.js');
const { PAYMENTS_COLLECTION, buildPaymentRecord } = requireFromFunctions('./lib/payments.js');

const projectId = process.env.GCLOUD_PROJECT;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const functionsHost = process.env.FUNCTIONS_EMULATOR_HOST;
if (!projectId || !authHost || !functionsHost || !process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Run with npm run test:functions:integration.');
}

const app = initializeApp({ projectId }, 'callable-auth');
const db = getFirestore(app);

const session = async (label, uid) => {
  const email = `${label}-${crypto.randomUUID()}@example.test`;
  const password = 'local-test-password';
  if (uid) {
    try {
      await getAuth(app).createUser({ uid, email, password });
    } catch (error) {
      const code = error.code || error.errorInfo?.code;
      if (code !== 'auth/uid-already-exists' && code !== 'auth/email-already-exists') throw error;
    }
    const customToken = await getAuth(app).createCustomToken(uid);
    const response = await fetch(
      `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=local`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    const body = await response.json();
    assert.equal(response.ok, true, JSON.stringify(body));
    return { uid, token: body.idToken };
  }
  const response = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=local`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return { uid: body.localId, token: body.idToken };
};

const call = async (name, token, data) => {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`http://${functionsHost}/${projectId}/us-central1/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return { status: response.status, body: await response.json() };
};

const expectError = (response, status, errorStatus, label) => {
  assert.equal(response.status, status, `${label || errorStatus}: ${JSON.stringify(response.body)}`);
  assert.equal(response.body.error.status, errorStatus, `${label || errorStatus}: ${JSON.stringify(response.body)}`);
};

const expectOk = (response, label) => {
  assert.equal(response.status, 200, `${label}: ${JSON.stringify(response.body)}`);
  return response.body.result;
};

const clear = async () => {
  const response = await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  assert.equal(response.ok, true, await response.text());
};

const scores = [
  [6, 4],
  [6, 2],
  [0, 0],
];

const seedProvider = async (providerId, memberUid, name = 'Auth Stringer') => {
  await db.doc(`providers/${providerId}`).set({
    id: providerId,
    name,
    roles: ['stringer'],
    member_uid: memberUid,
  });
};

const seedService = async (serviceId, providerId) => {
  await db.doc(`services/${serviceId}`).set({
    id: serviceId,
    type: 'offer',
    provider_id: providerId,
    provider_name: 'Auth Stringer',
    active: true,
    category: 'stringing',
    offer: 'Auth restring',
    points_cost: 15,
    total_price: 40,
    discount: 5,
  });
};

const seedOffer = async (rewardId, providerId) => {
  await db.doc(`tasks/${rewardId}`).set({
    type: 'offer',
    active: true,
    offer: 'Auth grip',
    points_cost: 20,
    provider_id: providerId,
    provider_name: 'Auth Stringer',
  });
};

beforeEach(clear);
after(() => deleteApp(app));

test('every protected callable rejects an unauthenticated request', async () => {
  for (const [name, data] of [
    ['applyTournamentResult', { matchId: 'missing', scores }],
    ['challengeResults', { matchId: 'missing' }],
    ['setGroupBonus', { eventId: 'missing', rrGroup: 0, award: true }],
    ['cancelMatch', { matchId: 'missing' }],
    ['withdrawEventParticipant', { eventId: 'missing', uid: 'someone', reason: 'other' }],
    ['upsertService', { provider_id: 'provider-auth', offer: 'x', category: 'stringing' }],
    ['deactivateService', { id: 'missing' }],
    ['redeemReward', { rewardId: 'missing' }],
    ['markCouponUsed', { code: 'RS-TEST-AA' }],
    ['flagCoupon', { code: 'RS-TEST-AA' }],
    ['requestCancellation', { code: 'RS-TEST-AA' }],
    ['reviewRedemption', { code: 'RS-TEST-AA', approve: true }],
    ['resolveCourtZone', { name: 'Auth Park', zone: 'North York' }],
    [
      'createCheckoutSession',
      { amount: 25, success_url: 'http://127.0.0.1:5000/ok', cancel_url: 'http://127.0.0.1:5000/no' },
    ],
    ['requestPaymentCancellation', { paymentId: 'missing' }],
    ['listPendingPaymentCancellations', {}],
    ['reviewPaymentCancellation', { paymentId: 'missing', approve: false }],
    ['reviewTaskClaim', { id: 'missing', approve: true }],
    ['book', { service_id: 'missing', provider_id: 'missing' }],
    ['racquetDropped', { booking_id: 'missing' }],
    ['requestCompletion', { booking_id: 'missing' }],
    ['confirmCompletion', { booking_id: 'missing', confirmed: true }],
    ['cancelLead', { booking_id: 'missing' }],
    ['assignEventOrganizers', { eventId: 'missing', organizerIds: ['x'] }],
  ]) {
    const response = await call(name, null, data);
    expectError(response, 401, 'UNAUTHENTICATED', name);
  }
});

test('signup lookup is pre-auth, rejects malformed email, and returns only booleans', async () => {
  const missing = await call('checkSignupEmail', undefined, {});
  expectError(missing, 400, 'INVALID_ARGUMENT', 'signup missing email');

  const oversized = await call('checkSignupEmail', undefined, { email: `${'a'.repeat(321)}@example.invalid` });
  expectError(oversized, 400, 'INVALID_ARGUMENT', 'signup oversized email');

  const email = `lookup-hit-${crypto.randomUUID()}@example.invalid`;
  await db.doc(`contacts/member-${crypto.randomUUID()}`).set({ email, phone: '4165550100' });
  const found = await call('checkSignupEmail', undefined, { email });
  const result = expectOk(found, 'signup exists');
  assert.equal(result.exists, true);
  assert.equal(result.secondary, false);
  assert.equal(Object.keys(result).sort().join(','), 'exists,secondary');

  const again = await call('checkSignupEmail', undefined, { email });
  assert.equal(expectOk(again, 'signup duplicate lookup').exists, true);
});

test('reward coupon use, flag, cancel, and review cover authz and duplicates', async () => {
  const player = await session('coupon-player');
  const outsider = await session('coupon-outsider');
  const providerMember = await session('coupon-provider');
  const administrator = await session('coupon-admin', SUPER_ADMIN_UID);
  const providerId = `provider-${crypto.randomUUID()}`;
  const rewardId = `reward-${crypto.randomUUID()}`;
  await Promise.all([
    seedProvider(providerId, providerMember.uid),
    seedOffer(rewardId, providerId),
    db.doc(`users/${player.uid}`).set({ name: 'Coupon Player' }),
    db.doc(`stats/${player.uid}`).set({ leaguePoints26: 50 }),
  ]);

  expectError(await call('redeemReward', player.token, {}), 400, 'INVALID_ARGUMENT', 'redeem missing reward');
  const redeemed = expectOk(await call('redeemReward', player.token, { rewardId }), 'redeem');
  const code = redeemed.code;
  expectError(await call('redeemReward', player.token, { rewardId }), 409, 'ALREADY_EXISTS', 'redeem duplicate');

  expectError(await call('markCouponUsed', player.token, {}), 400, 'INVALID_ARGUMENT', 'use missing code');
  expectError(await call('markCouponUsed', outsider.token, { code }), 403, 'PERMISSION_DENIED', 'use outsider');
  expectError(await call('flagCoupon', outsider.token, { code }), 403, 'PERMISSION_DENIED', 'flag outsider');
  expectError(await call('requestCancellation', outsider.token, { code }), 403, 'PERMISSION_DENIED', 'cancel outsider');
  expectError(
    await call('reviewRedemption', outsider.token, { code, approve: true }),
    403,
    'PERMISSION_DENIED',
    'review outsider',
  );
  expectError(await call('reviewRedemption', administrator.token, {}), 400, 'INVALID_ARGUMENT', 'review missing code');

  expectOk(await call('flagCoupon', providerMember.token, { code, note: 'no-show' }), 'flag');
  expectError(await call('flagCoupon', providerMember.token, { code }), 400, 'FAILED_PRECONDITION', 'flag duplicate');
  expectError(
    await call('requestCancellation', player.token, { code }),
    400,
    'FAILED_PRECONDITION',
    'cancel flagged coupon',
  );

  expectOk(await call('markCouponUsed', providerMember.token, { code }), 'use after flag');
  expectError(
    await call('markCouponUsed', providerMember.token, { code }),
    400,
    'FAILED_PRECONDITION',
    'use duplicate',
  );

  const secondReward = `reward-${crypto.randomUUID()}`;
  await seedOffer(secondReward, providerId);
  await db.doc(`tasks/${secondReward}`).update({ offer: 'Auth overgrip', points_cost: 10 });
  const second = expectOk(await call('redeemReward', player.token, { rewardId: secondReward }), 'second redeem');
  expectOk(await call('requestCancellation', player.token, { code: second.code }), 'cancel request');
  expectError(
    await call('requestCancellation', player.token, { code: second.code }),
    400,
    'FAILED_PRECONDITION',
    'cancel duplicate',
  );
  expectOk(await call('reviewRedemption', administrator.token, { code: second.code, approve: true }), 'review approve');
  expectError(
    await call('reviewRedemption', administrator.token, { code: second.code, approve: true }),
    400,
    'FAILED_PRECONDITION',
    'review duplicate',
  );
});

test('booking lifecycle rejects outsiders, malformed ids, and illegal repeats', async () => {
  const member = await session('book-member');
  const outsider = await session('book-outsider');
  const providerMember = await session('book-provider');
  const providerId = `provider-${crypto.randomUUID()}`;
  const serviceId = `service-${crypto.randomUUID()}`;
  await Promise.all([
    seedProvider(providerId, providerMember.uid),
    seedService(serviceId, providerId),
    db.doc(`users/${member.uid}`).set({ name: 'Booking Member' }),
  ]);

  expectError(await call('book', member.token, {}), 400, 'INVALID_ARGUMENT', 'book missing service');
  expectError(
    await call('book', member.token, { service_id: serviceId, provider_id: 'other-provider' }),
    400,
    'FAILED_PRECONDITION',
    'book mismatched provider',
  );
  const first = expectOk(await call('book', member.token, { service_id: serviceId, provider_id: providerId }), 'book');
  const bookingId = first.booking.id;
  const second = expectOk(
    await call('book', member.token, { service_id: serviceId, provider_id: providerId }),
    'book duplicate lead',
  );
  assert.notEqual(second.booking.id, bookingId);

  expectError(await call('racquetDropped', member.token, {}), 400, 'INVALID_ARGUMENT', 'drop missing id');
  expectError(
    await call('racquetDropped', outsider.token, { booking_id: bookingId }),
    403,
    'PERMISSION_DENIED',
    'drop outsider',
  );
  expectOk(await call('racquetDropped', providerMember.token, { booking_id: bookingId }), 'drop');
  expectError(
    await call('racquetDropped', providerMember.token, { booking_id: bookingId }),
    400,
    'FAILED_PRECONDITION',
    'drop duplicate',
  );

  expectError(
    await call('requestCompletion', outsider.token, { booking_id: bookingId }),
    403,
    'PERMISSION_DENIED',
    'complete outsider',
  );
  expectOk(await call('requestCompletion', providerMember.token, { booking_id: bookingId }), 'request completion');
  expectOk(
    await call('requestCompletion', providerMember.token, { booking_id: bookingId }),
    'request completion duplicate',
  );

  expectError(
    await call('confirmCompletion', outsider.token, { booking_id: bookingId, confirmed: true }),
    403,
    'PERMISSION_DENIED',
    'confirm outsider',
  );
  expectOk(await call('confirmCompletion', member.token, { booking_id: bookingId, confirmed: true }), 'confirm');
  expectError(
    await call('confirmCompletion', member.token, { booking_id: bookingId, confirmed: true }),
    400,
    'FAILED_PRECONDITION',
    'confirm duplicate',
  );

  expectError(
    await call('cancelLead', outsider.token, { booking_id: second.booking.id }),
    403,
    'PERMISSION_DENIED',
    'cancel outsider',
  );
  expectOk(await call('cancelLead', member.token, { booking_id: second.booking.id }), 'cancel lead');
  expectError(
    await call('cancelLead', member.token, { booking_id: second.booking.id }),
    400,
    'FAILED_PRECONDITION',
    'cancel duplicate',
  );
});

test('service admin and task-claim review reject outsiders and repeats', async () => {
  const owner = await session('service-owner');
  const outsider = await session('service-outsider');
  const providerId = `provider-${crypto.randomUUID()}`;
  await seedProvider(providerId, owner.uid);

  expectError(
    await call('upsertService', owner.token, { offer: 'Restring' }),
    400,
    'INVALID_ARGUMENT',
    'upsert missing provider',
  );
  expectError(
    await call('upsertService', outsider.token, { provider_id: providerId, offer: 'Restring', category: 'stringing' }),
    403,
    'PERMISSION_DENIED',
    'upsert outsider',
  );
  expectError(
    await call('upsertService', owner.token, {
      provider_id: providerId,
      offer: 'Restring',
      category: 'not-a-category',
    }),
    400,
    'INVALID_ARGUMENT',
    'upsert malformed category',
  );
  const created = expectOk(
    await call('upsertService', owner.token, { provider_id: providerId, offer: 'Restring', category: 'stringing' }),
    'upsert',
  );
  const again = expectOk(
    await call('upsertService', owner.token, {
      id: created.id,
      provider_id: providerId,
      offer: 'Restring',
      category: 'stringing',
    }),
    'upsert duplicate merge',
  );
  assert.equal(again.id, created.id);

  expectError(await call('deactivateService', owner.token, {}), 400, 'INVALID_ARGUMENT', 'deactivate missing id');
  expectError(
    await call('deactivateService', outsider.token, { id: created.id }),
    403,
    'PERMISSION_DENIED',
    'deactivate outsider',
  );
  expectOk(await call('deactivateService', owner.token, { id: created.id }), 'deactivate');
  expectOk(await call('deactivateService', owner.token, { id: created.id }), 'deactivate duplicate');

  const eventId = `event-${crypto.randomUUID()}`;
  const claimId = `claim-${crypto.randomUUID()}`;
  await Promise.all([
    db.doc(`events/${eventId}`).set({ creator_id: owner.uid, title: 'Claim Event' }),
    db.doc(`task_claims/${claimId}`).set({
      type: 'volunteer',
      event_id: eventId,
      uid: outsider.uid,
      status: 'pending',
    }),
  ]);
  expectError(await call('reviewTaskClaim', owner.token, {}), 400, 'INVALID_ARGUMENT', 'claim missing id');
  expectError(
    await call('reviewTaskClaim', outsider.token, { id: claimId, approve: true }),
    403,
    'PERMISSION_DENIED',
    'claim outsider',
  );
  expectOk(await call('reviewTaskClaim', owner.token, { id: claimId, approve: true }), 'claim approve');
  expectError(
    await call('reviewTaskClaim', owner.token, { id: claimId, approve: true }),
    400,
    'FAILED_PRECONDITION',
    'claim duplicate',
  );
});

test('challenge, group bonus, cancel, and withdrawal cover authz and duplicates', async () => {
  const player = await session('match-player');
  const opponent = await session('match-opponent');
  const outsider = await session('match-outsider');
  const organizer = await session('match-organizer');
  const eventId = `event-${crypto.randomUUID()}`;
  const matchId = `challenge-${crypto.randomUUID()}`;
  const cancelId = `cancel-${crypto.randomUUID()}`;
  const rrMatchId = `rr-${crypto.randomUUID()}`;
  await Promise.all([
    db.doc(`events/${eventId}`).set({ creator_id: organizer.uid, title: 'Auth Event' }),
    db.doc(`event_participants/${crypto.randomUUID()}`).set({
      event_id: eventId,
      uid: player.uid,
      status: 'active',
      user_name: 'Player',
    }),
    db.doc(`matches/${matchId}`).set({
      category: 'challenge',
      status: 'accepted',
      player_1_uid: player.uid,
      player_1_name: 'Player',
      player_2_uid: opponent.uid,
      player_2_name: 'Opponent',
    }),
    db.doc(`matches/${cancelId}`).set({
      category: 'rally',
      status: 'accepted',
      player_1_uid: player.uid,
      player_1_name: 'Player',
      player_2_uid: opponent.uid,
      player_2_name: 'Opponent',
    }),
    db.doc(`matches/${rrMatchId}`).set({
      event_id: eventId,
      category: 'singles',
      format: 'rr',
      round: 'RR',
      rr_group: 0,
      status: 'pending',
      player_1_uid: player.uid,
      player_1_name: 'Player',
      player_2_uid: opponent.uid,
      player_2_name: 'Opponent',
    }),
  ]);

  expectError(await call('challengeResults', player.token, {}), 400, 'INVALID_ARGUMENT', 'challenge missing id');
  expectError(
    await call('challengeResults', outsider.token, { matchId, winnerUid: player.uid, scores }),
    403,
    'PERMISSION_DENIED',
    'challenge outsider',
  );
  const applied = expectOk(
    await call('challengeResults', player.token, { matchId, winnerUid: player.uid, scores }),
    'challenge apply',
  );
  assert.equal(applied.applied, true);
  const duplicate = expectOk(
    await call('challengeResults', player.token, { matchId, winnerUid: player.uid, scores }),
    'challenge duplicate',
  );
  assert.equal(duplicate.duplicate, true);

  expectError(
    await call('setGroupBonus', organizer.token, { eventId, rrGroup: -1, award: true }),
    400,
    'INVALID_ARGUMENT',
    'bonus malformed',
  );
  expectError(
    await call('setGroupBonus', outsider.token, { eventId, rrGroup: 0, award: true }),
    403,
    'PERMISSION_DENIED',
    'bonus outsider',
  );
  const bonus = expectOk(await call('setGroupBonus', organizer.token, { eventId, rrGroup: 0, award: true }), 'bonus');
  assert.equal(bonus.applied, true);
  const bonusAgain = expectOk(
    await call('setGroupBonus', organizer.token, { eventId, rrGroup: 0, award: true }),
    'bonus duplicate',
  );
  assert.equal(bonusAgain.applied, false);

  expectError(await call('cancelMatch', player.token, {}), 400, 'INVALID_ARGUMENT', 'cancel missing id');
  expectError(
    await call('cancelMatch', outsider.token, { matchId: cancelId }),
    400,
    'FAILED_PRECONDITION',
    'cancel outsider',
  );
  expectOk(await call('cancelMatch', player.token, { matchId: cancelId }), 'cancel accepted');
  expectError(await call('cancelMatch', player.token, { matchId: cancelId }), 404, 'NOT_FOUND', 'cancel duplicate');

  expectError(
    await call('withdrawEventParticipant', player.token, { reason: 'other' }),
    400,
    'INVALID_ARGUMENT',
    'withdraw missing event',
  );
  expectError(
    await call('withdrawEventParticipant', outsider.token, { eventId, uid: player.uid, reason: 'other' }),
    403,
    'PERMISSION_DENIED',
    'withdraw outsider',
  );
  expectError(
    await call('withdrawEventParticipant', player.token, { eventId, reason: 'not-a-reason' }),
    400,
    'INVALID_ARGUMENT',
    'withdraw malformed reason',
  );
  const withdrawn = expectOk(
    await call('withdrawEventParticipant', player.token, { eventId, reason: 'other' }),
    'withdraw',
  );
  assert.equal(withdrawn.withdrawn, true);
  const withdrawnAgain = expectOk(
    await call('withdrawEventParticipant', player.token, { eventId, reason: 'other' }),
    'withdraw duplicate',
  );
  assert.equal(withdrawnAgain.withdrawn, true);
});

test('court zone and organizer assignment cover authz, malformed input, and repeats', async () => {
  const administrator = await session('court-admin', SUPER_ADMIN_UID);
  const owner = await session('event-owner');
  const assigned = await session('event-assigned');
  const outsider = await session('event-outsider');
  const eventId = `event-${crypto.randomUUID()}`;
  await db
    .doc(`events/${eventId}`)
    .set({ creator_id: owner.uid, title: 'Assign Event', organizer_ids: [assigned.uid] });

  expectError(
    await call('resolveCourtZone', outsider.token, { name: 'Auth Park', zone: 'North York' }),
    403,
    'PERMISSION_DENIED',
    'court outsider',
  );
  expectError(
    await call('resolveCourtZone', administrator.token, { name: 'Auth Park', zone: 'Mars' }),
    400,
    'INVALID_ARGUMENT',
    'court malformed zone',
  );
  const created = expectOk(
    await call('resolveCourtZone', administrator.token, { name: 'Auth Park Tennis', zone: 'North York' }),
    'court add',
  );
  assert.equal(created.ok, true);
  const updated = expectOk(
    await call('resolveCourtZone', administrator.token, { name: 'Auth Park Tennis', zone: 'Etobicoke' }),
    'court duplicate re-zone',
  );
  assert.equal(updated.zone, 'Etobicoke');

  expectError(
    await call('assignEventOrganizers', owner.token, { eventId, organizerIds: 'not-an-array' }),
    400,
    'INVALID_ARGUMENT',
    'assign malformed ids',
  );
  expectError(
    await call('assignEventOrganizers', assigned.token, { eventId, organizerIds: [assigned.uid, outsider.uid] }),
    403,
    'PERMISSION_DENIED',
    'assign outsider',
  );
  const assignedResult = expectOk(
    await call('assignEventOrganizers', owner.token, { eventId, organizerIds: [assigned.uid] }),
    'assign identical',
  );
  assert.equal(assignedResult.changed, false);
  const changed = expectOk(
    await call('assignEventOrganizers', owner.token, { eventId, organizerIds: [outsider.uid] }),
    'assign replace',
  );
  assert.equal(changed.changed, true);
  assert.deepEqual(changed.organizer_ids, [outsider.uid]);
});

test('payment cancellation callables cover authz, malformed input, and repeats', async () => {
  const member = await session('pay-member');
  const outsider = await session('pay-outsider');
  const administrator = await session('pay-admin', SUPER_ADMIN_UID);
  const paymentId = `donation-${crypto.randomUUID()}`;
  await db.doc(`${PAYMENTS_COLLECTION}/${paymentId}`).set(
    buildPaymentRecord({
      id: paymentId,
      uid: member.uid,
      user_name: 'Pay Member',
      type: 'donation',
      amount: 25,
      paid_at: new Date().toISOString(),
      stripe_checkout_session_id: `cs_${paymentId}`,
      stripe_payment_intent_id: `pi_${paymentId}`,
    }),
  );

  expectError(
    await call('requestPaymentCancellation', member.token, {}),
    400,
    'INVALID_ARGUMENT',
    'pay cancel missing id',
  );
  expectError(
    await call('requestPaymentCancellation', outsider.token, { paymentId }),
    403,
    'PERMISSION_DENIED',
    'pay cancel outsider',
  );
  expectOk(await call('requestPaymentCancellation', member.token, { paymentId }), 'pay cancel');
  expectError(
    await call('requestPaymentCancellation', member.token, { paymentId }),
    400,
    'FAILED_PRECONDITION',
    'pay cancel duplicate',
  );

  expectError(await call('listPendingPaymentCancellations', member.token, {}), 403, 'PERMISSION_DENIED', 'list member');
  const listed = expectOk(await call('listPendingPaymentCancellations', administrator.token, {}), 'list pending');
  assert.equal(
    listed.items.some((row) => row.id === paymentId),
    true,
  );
  const listedAgain = expectOk(
    await call('listPendingPaymentCancellations', administrator.token, {}),
    'list duplicate',
  );
  assert.equal(listedAgain.items.length, listed.items.length);
  expectError(
    await call('listPendingPaymentCancellations', administrator.token, { card_number: '4242' }),
    400,
    'INVALID_ARGUMENT',
    'list malformed card',
  );

  expectError(
    await call('reviewPaymentCancellation', member.token, { paymentId, approve: false }),
    403,
    'PERMISSION_DENIED',
    'review member',
  );
  expectError(
    await call('reviewPaymentCancellation', administrator.token, { approve: false }),
    400,
    'INVALID_ARGUMENT',
    'review missing id',
  );
  expectOk(
    await call('reviewPaymentCancellation', administrator.token, { paymentId, approve: false }),
    'review decline',
  );
  expectError(
    await call('reviewPaymentCancellation', administrator.token, { paymentId, approve: false }),
    400,
    'FAILED_PRECONDITION',
    'review duplicate',
  );

  expectError(
    await call('createCheckoutSession', member.token, {
      amount: 0,
      success_url: 'http://127.0.0.1:5000/ok',
      cancel_url: 'http://127.0.0.1:5000/no',
    }),
    400,
    'INVALID_ARGUMENT',
    'checkout malformed amount',
  );
  expectError(
    await call('createCheckoutSession', member.token, {
      amount: 25,
      success_url: 'http://127.0.0.1:5000/ok',
      cancel_url: 'http://127.0.0.1:5000/no',
      card_number: '4242424242424242',
    }),
    400,
    'INVALID_ARGUMENT',
    'checkout card data',
  );
});
