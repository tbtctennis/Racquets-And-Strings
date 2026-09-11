import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { NAME_RULE, PASSWORD_RULE } from '../../src/features/signup/signupForm.ts';
import { MIN_REWARD_COST } from '../../src/features/services/types.ts';

const rewardsAvailable = (redeemable) => Math.floor(Math.max(0, redeemable) / MIN_REWARD_COST);

const src = (relative) => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('rewardsAvailable is the one helper for how many rewards a balance covers', () => {
  assert.equal(rewardsAvailable(-5), 0);
  assert.equal(rewardsAvailable(0), 0);
  assert.equal(rewardsAvailable(MIN_REWARD_COST - 1), 0);
  assert.equal(rewardsAvailable(MIN_REWARD_COST), 1);
  assert.equal(rewardsAvailable(MIN_REWARD_COST * 2 + 1), 2);
});

test('Tasks and Notifications call rewardsAvailable; the formula lives in one helper', async () => {
  const helper = await src('src/features/services/useServices.ts');
  const tasks = await src('src/pages/Tasks.tsx');
  const notifications = await src('src/pages/Notifications.tsx');

  assert.match(helper, /export function rewardsAvailable\(redeemable: number\): number/);
  assert.equal((helper.match(/Math\.floor\(Math\.max\(0, redeemable\) \/ MIN_REWARD_COST\)/g) || []).length, 1);
  assert.match(tasks, /rewardsAvailable\(redeemable\)/);
  assert.match(notifications, /rewardsAvailable\(redeemable\)/);
  assert.doesNotMatch(tasks, /Math\.floor\(Math\.max\(0, redeemable\)/);
  assert.doesNotMatch(notifications, /Math\.floor\(Math\.max\(0, redeemable\)/);
});

test('Events show joined counts on the card and in the join sheet', async () => {
  const card = await src('src/features/events/EventsElements.tsx');
  const page = await src('src/pages/Events.tsx');
  assert.match(card, /\{joinedCount\} joined/);
  assert.doesNotMatch(card, /Limited spots remaining/);
  assert.match(page, /joinedCount=\{joinedCounts\[event\.id\] \?\? 0\}/);
  assert.match(page, /joinedCount=\{joinedCounts\[selectedEvent\.id\] \?\? 0\}/);
});

test('History shows match totals and links opponent and event', async () => {
  const history = await src('src/pages/History.tsx');
  assert.match(history, /label="Matches"/);
  assert.match(history, /label="Wins"/);
  assert.match(history, /label="Win rate"/);
  assert.match(history, /\/players\/\$\{m\.opponentId\}/);
  assert.match(history, /\/matches\?mode=tournament&event=\$\{m\.eventId\}/);
});

test('listed remaining copy defects read correctly', async () => {
  const signup = await src('src/pages/Signup.tsx');
  const tournament = await src('src/pages/tournament/TournamentElements.tsx');
  const matches = await src('src/pages/Matches.tsx');
  const tasks = await src('src/pages/Tasks.tsx');
  const checkIn = await src('src/features/tasks/CheckInModal.tsx');
  const rr = await src('src/pages/tournament/RRGroupCard.tsx');
  const catalog = await src('src/features/tasks/taskCatalog.ts');
  const claim = await src('src/features/tasks/ClaimModal.tsx');
  const services = await src('src/pages/services/ServicesElements.tsx');
  const courts = await src('src/pages/courtmap/CourtMapElements.tsx');
  const profile = await src('src/features/profile/services/profileService.ts');
  const form = await src('src/features/signup/signupForm.ts');

  assert.doesNotMatch(signup, /PHASE: VERIFY EMAIL/);
  assert.doesNotMatch(signup, /joining the league/);
  assert.doesNotMatch(signup, /further instructions/);
  assert.match(signup, /Thanks for joining/);
  assert.match(signup, /A welcome email is on its way/);
  assert.match(signup, /That also turns on Google sign-in for next time/);
  assert.equal((signup.match(/>Or</g) || []).length, 2);

  assert.equal(NAME_RULE, 'Name must be 3–80 characters, with no numbers.');
  assert.match(form, /NAME_RULE/);
  assert.match(signup, /\{NAME_RULE\}/);
  assert.match(profile, /throw new Error\(NAME_RULE\)/);
  assert.doesNotMatch(form, /Name cannot contain numbers/);
  assert.doesNotMatch(signup, /3–80 letters/);
  assert.equal(PASSWORD_RULE, 'Use 6 to 80 characters. Avoid a simple run like 123456 or abcdef.');

  assert.doesNotMatch(tournament, /runners-up fill/);
  assert.match(tournament, /The winner of each group goes through to the knockout/);

  assert.match(matches, /Nobody nearby yet\. Nearby includes people who share a court or your zone\./);

  assert.doesNotMatch(tasks, /have > 0/);
  assert.match(tasks, /\{have\}\/\{t\.need\}/);
  assert.match(tasks, />\s*Check in\s*</);
  assert.match(checkIn, />\s*Check in\s*</);

  assert.match(rr, /Tap a player to contact them/);
  assert.doesNotMatch(rr, /handle your match/);

  assert.doesNotMatch(catalog, /first approved waiting-board/);
  assert.match(catalog, /first waiting-board report/);

  assert.match(claim, /Claim submitted/);
  assert.match(claim, /An administrator will approve it before it counts/);
  assert.doesNotMatch(claim, /Sent for review/);

  assert.doesNotMatch(services, /avail the services/);
  assert.match(services, /to redeem points or book a service/);

  assert.match(courts, /Showing courts with members\. Switch to All Courts to see the rest\./);
});
