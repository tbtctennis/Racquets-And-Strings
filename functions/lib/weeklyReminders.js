/**
 * Pure weekly-reminder itemization. One users/{uid} read per distinct opponent, batched at
 * GET_ALL_LIMIT — Firestore BatchGetDocuments rejects more than 100 refs per getAll.
 * Round-robin group matches (round RR) have no deadline (L17); a scheduled proposed_date still
 * lists. Live round_deadlines keys are `${drawKey}:${round}`; fixtures also use `|`.
 */

const GET_ALL_LIMIT = 100;

function asMap(value) {
  if (!value) return new Map();
  if (value instanceof Map) return value;
  return new Map(Object.entries(value));
}

function matchPlayers(match) {
  return [...new Set([match.player_1_uid, match.player_2_uid].filter(Boolean))];
}

function opponentUid(match, uid) {
  if (match.player_1_uid === uid) return match.player_2_uid || '';
  if (match.player_2_uid === uid) return match.player_1_uid || '';
  return '';
}

function opponentNameFromMatch(match, uid) {
  if (match.player_1_uid === uid) return match.player_2_name || '';
  if (match.player_2_uid === uid) return match.player_1_name || '';
  return '';
}

function isRrGroupStage(match) {
  return match.round === 'RR' || (!!match.rr_group && match.format === 'rr');
}

function lookup(map, id) {
  if (!id) return '';
  if (typeof map.get === 'function') return map.get(id) || '';
  return map[id] || '';
}

function formatReminderDate(iso) {
  if (!iso) return '';
  const day = String(iso).slice(0, 10);
  const d = new Date(`${day}T12:00:00`);
  return Number.isNaN(d.getTime()) ? day : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function roundDeadline(event, match) {
  const deadlines = event?.round_deadlines || {};
  const round = match.round;
  if (!round || isRrGroupStage(match)) return '';
  if (deadlines[round]) return deadlines[round];
  const hits = Object.keys(deadlines).filter((key) => key.endsWith(`:${round}`) || key.endsWith(`|${round}`));
  return hits.length === 1 ? deadlines[hits[0]] : '';
}

function matchReminderDate(match, event) {
  if (match.proposed_date) return match.proposed_date;
  if (isRrGroupStage(match)) return '';
  return match.deadline || roundDeadline(event, match) || '';
}

function reminderWeekKey(now = new Date(), timeZone = 'America/Toronto') {
  return now.toLocaleDateString('en-CA', { timeZone });
}

function eventReadIds(matches) {
  return [...new Set((matches || []).map((match) => match.event_id).filter(Boolean))];
}

function opponentReadIds(matches) {
  const ids = new Set();
  for (const match of matches || []) {
    for (const uid of matchPlayers(match)) {
      const opponent = opponentUid(match, uid);
      if (opponent) ids.add(opponent);
    }
  }
  return [...ids];
}

function boundedReadChunks(ids, limit = GET_ALL_LIMIT) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  const chunks = [];
  for (let i = 0; i < unique.length; i += limit) chunks.push(unique.slice(i, i + limit));
  return chunks;
}

function resolveOpponentName(match, uid, namesByUid) {
  const stored = lookup(namesByUid, opponentUid(match, uid));
  if (stored && stored !== 'Player Loading') return stored;
  const denormalized = opponentNameFromMatch(match, uid);
  if (denormalized && denormalized !== 'Player Loading' && denormalized !== 'BYE') return denormalized;
  return 'your opponent';
}

function pendingItemsForUser(uid, matches, eventById, namesByUid) {
  const seen = new Set();
  const items = [];
  for (const match of matches) {
    const opponent = opponentUid(match, uid);
    const date = matchReminderDate(match, eventById.get(match.event_id) || {});
    const key = `${opponent}|${date || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ name: resolveOpponentName(match, uid, namesByUid), date });
  }
  items.sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.name.localeCompare(b.name);
  });
  return items;
}

function formatItemLine(item) {
  const date = formatReminderDate(item.date);
  return date ? `vs ${item.name} ${date}` : `vs ${item.name}`;
}

function pendingMatchNotices({ matches = [], eventById, namesByUid, weekKey }) {
  const events = asMap(eventById);
  const names = asMap(namesByUid);
  const byUser = new Map();
  for (const match of matches) {
    for (const uid of matchPlayers(match)) {
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid).push(match);
    }
  }
  const notices = [];
  for (const [uid, userMatches] of byUser) {
    const items = pendingItemsForUser(uid, userMatches, events, names);
    if (!items.length) continue;
    const count = userMatches.length;
    notices.push({
      key: `weekly-pending:${weekKey}`,
      uid,
      payload: {
        type: 'reminder_pending_matches',
        title: `You have ${count} match${count === 1 ? '' : 'es'} to play`,
        body: items.map(formatItemLine).join(' · '),
        link: '/tournament',
      },
    });
  }
  return notices;
}

function incompleteMatchNotices({ pendingCountByUser, rallyCountByUser, challengeCountByUser, weekKey }) {
  const pending = asMap(pendingCountByUser);
  const rallies = asMap(rallyCountByUser);
  const challenges = asMap(challengeCountByUser);
  const allUids = new Set([...pending.keys(), ...rallies.keys(), ...challenges.keys()]);
  const notices = [];
  for (const uid of allUids) {
    const total = (pending.get(uid) || 0) + (rallies.get(uid) || 0) + (challenges.get(uid) || 0);
    if (!total) continue;
    notices.push({
      key: `weekly-incomplete:${weekKey}`,
      uid,
      payload: {
        type: 'reminder_incomplete_matches',
        title: `You have ${total} incomplete match${total === 1 ? '' : 'es'}`,
        body: 'Open Matches to arrange your outstanding games.',
        link: '/matches',
      },
    });
  }
  return notices;
}

module.exports = {
  GET_ALL_LIMIT,
  boundedReadChunks,
  eventReadIds,
  formatReminderDate,
  incompleteMatchNotices,
  matchReminderDate,
  opponentReadIds,
  pendingMatchNotices,
  reminderWeekKey,
};
