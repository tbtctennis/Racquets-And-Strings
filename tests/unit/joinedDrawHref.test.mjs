import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { joinedDrawHref } from '../../src/features/events/joinedDrawHref.ts';

test('joinedDrawHref opens the tournament event the member joined', () => {
  assert.equal(
    joinedDrawHref({ id: 'spring-open', type: 'Tournaments' }),
    '/matches?mode=tournament&event=spring-open',
  );
  assert.equal(
    joinedDrawHref({ id: '  west-open  ', type: 'Tournaments' }),
    '/matches?mode=tournament&event=west-open',
  );
});

test('joinedDrawHref withholds socials, ladders, and events without an id', () => {
  assert.equal(joinedDrawHref({ id: 'social-1', type: 'Socials' }), undefined);
  assert.equal(joinedDrawHref({ id: 'ladder-1', type: 'League Ladder' }), undefined);
  assert.equal(joinedDrawHref({ id: 'special-1', type: 'Specials' }), undefined);
  assert.equal(joinedDrawHref({ id: '', type: 'Tournaments' }), undefined);
  assert.equal(joinedDrawHref({ id: '   ', type: 'Tournaments' }), undefined);
  assert.equal(joinedDrawHref({ type: 'Tournaments' }), undefined);
  assert.equal(joinedDrawHref(null), undefined);
  assert.equal(joinedDrawHref(undefined), undefined);
});

test('Joined status navigates to the member draw and keeps visibility on the tournament page', async () => {
  const card = await readFile(new URL('../../src/features/events/EventsElements.tsx', import.meta.url), 'utf8');
  const hook = await readFile(new URL('../../src/pages/tournament/useTournament.ts', import.meta.url), 'utf8');
  const page = await readFile(new URL('../../src/pages/Tournament.tsx', import.meta.url), 'utf8');

  assert.match(card, /joinedDrawHref\(event\)/);
  assert.match(card, /if \(drawHref\) \{/);
  assert.match(card, /navigate\(drawHref\)/);
  assert.doesNotMatch(card, /disabled=\{isJoined \|\| joinClosed \|\| authLoading\}/);
  assert.match(card, /isJoined && !drawHref/);

  assert.match(hook, /setActiveTab\(userDraw\.tab\)/);
  assert.match(hook, /setActiveDoubles\(userDraw\.division\)/);
  assert.match(hook, /setActiveSkill\(userDraw\.skillGroup as SkillGroup\)/);
  assert.match(hook, /setActiveZone\(zone\)/);
  assert.match(
    hook,
    /d\.tab === userDraw\.tab && \(userDraw\.tab !== 'doubles' \|\| d\.division === userDraw\.division\)/,
  );

  assert.match(page, /joinLocked = !pastMode && !isCreator && !userParticipant/);
});
