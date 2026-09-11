/**
 * Pure ranking math for the weekly snapshot. `rankSnapshot.js` and
 * `scripts/snapshot-ranks.mjs` both write `stats.rankPosition` from this.
 *
 * Division filter mirrors `inDivision()` in `src/features/leagues/useStandings.ts`.
 */
const DIV_TABS = ['mens', 'womens', 'doubles'];

const inDivision = (league, tab) => {
  const l = (league || '').toLowerCase();
  if (tab === 'mens') return (l.includes('men') || l.includes('male')) && !l.includes('women') && !l.includes('female');
  if (tab === 'womens') return l.includes('wom') || l.includes('female');
  if (tab === 'doubles') return l.includes('double') || l.includes('mixed');
  return false;
};

/**
 * @param {{ uid: string, league: string, points: number, rankPosition: number | null }[]} players
 * @returns {{ uid: string, position: number, trend: string, move: number, historyDir: string | null }[]}
 */
const computeRankUpdates = (players) => {
  const ops = [];
  for (const tab of DIV_TABS) {
    const ranked = players.filter((p) => inDivision(p.league, tab)).sort((a, b) => b.points - a.points);
    ranked.forEach((p, i) => {
      const position = i + 1;
      const old = p.rankPosition;
      if (old === position) return;
      const trend = old === null ? 'flat' : position < old ? 'up' : 'down';
      const move = old === null ? 0 : Math.abs(old - position);
      ops.push({ uid: p.uid, position, trend, move, historyDir: old === null ? null : trend });
    });
  }
  return ops;
};

module.exports = { DIV_TABS, inDivision, computeRankUpdates };
