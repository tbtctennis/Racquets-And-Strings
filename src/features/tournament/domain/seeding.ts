import { snapshotRank } from '../../leagues/snapshotRank';

/**
 * Pure knockout seeding helpers. No Firestore. Round Robin groups are never seeded.
 * rankPosition is the weekly snapshot (D8-RNK-T1) and is not an entry-order key.
 */

/** Half the draw, capped at 10. 4→2, 8→4, 16→8, 32→10. */
export const seedCount = (drawSize: number) => Math.min(Math.floor(drawSize / 2), 10);

/** P/G won % as pointswon / totalPointsPlayed. Missing or zero played is 0, not NaN. */
export const pgWonRatio = (
  stats: { pointswon?: number | undefined; totalPointsPlayed?: number | undefined } | null | undefined,
): number => {
  const played = stats?.totalPointsPlayed ?? 0;
  if (!(played > 0)) return 0;
  return (stats?.pointswon ?? 0) / played;
};

export type SeedingEntrant = {
  uid: string;
  name: string;
  leaguePoints26?: number | undefined;
  pointswon?: number | undefined;
  totalPointsPlayed?: number | undefined;
};

export type SeededEntrant<T extends SeedingEntrant = SeedingEntrant> = T & { seed: number };

/** leaguePoints26 desc, then P/G won % desc, then name asc (case-insensitive). uid last so join time is not a rank. */
export const compareEntrants = (a: SeedingEntrant, b: SeedingEntrant): number => {
  const points = (b.leaguePoints26 ?? 0) - (a.leaguePoints26 ?? 0);
  if (points !== 0) return points;
  const pg = pgWonRatio(b) - pgWonRatio(a);
  if (pg !== 0) return pg;
  const name = (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'accent' });
  if (name !== 0) return name;
  return (a.uid ?? '').localeCompare(b.uid ?? '');
};

/** Recomputes 1..n seeds from the live order. A stronger joiner pushes everyone below them down. */
export const orderEntrants = <T extends SeedingEntrant>(entrants: readonly T[]): SeededEntrant<T>[] =>
  [...entrants].sort(compareEntrants).map((entrant, index) => ({ ...entrant, seed: index + 1 }));

export type RRKnockoutOrderInput = {
  uid: string;
  name: string;
  groupPoints: number;
  pointswon?: number | undefined;
  totalPointsPlayed?: number | undefined;
  rankPosition?: number | undefined;
};

export type RRKnockoutSeeded = RRKnockoutOrderInput & { seed: number };

export type RRGroupStanding = {
  userId: string;
  name: string;
  points: number;
  rank: number;
};

export type RRKnockoutStats = {
  pointswon?: number | undefined;
  totalPointsPlayed?: number | undefined;
  rankPosition?: number | undefined;
};

const rankOrLast = (player: RRKnockoutOrderInput): number => snapshotRank(player) ?? Number.POSITIVE_INFINITY;

/** Group points desc, then P/G won % desc, then snapshot rank asc, then name asc. */
export const compareRRKnockoutOrder = (a: RRKnockoutOrderInput, b: RRKnockoutOrderInput): number => {
  const points = b.groupPoints - a.groupPoints;
  if (points !== 0) return points;
  const pg = pgWonRatio(b) - pgWonRatio(a);
  if (pg !== 0) return pg;
  const rank = rankOrLast(a) - rankOrLast(b);
  if (rank !== 0) return rank;
  const name = (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'accent' });
  if (name !== 0) return name;
  return (a.uid ?? '').localeCompare(b.uid ?? '');
};

/** Order one draw's RR advancers for the knockout. Seed 1 is that bracket's top player. */
export const orderRRKnockout = (players: readonly RRKnockoutOrderInput[]): RRKnockoutSeeded[] =>
  [...players].sort(compareRRKnockoutOrder).map((player, index) => ({ ...player, seed: index + 1 }));

/**
 * Top `advancementCount` from each group's standings, then the four-criterion knockout order.
 * Groups themselves stay unseeded; only the returned knockout list is numbered.
 */
export const orderRRGroupWinners = (
  standingsByGroup: ReadonlyArray<ReadonlyArray<RRGroupStanding>>,
  statsByUid: Readonly<Record<string, RRKnockoutStats | undefined>> = {},
  advancementCount: 1 | 2 = 1,
): RRKnockoutSeeded[] => {
  const advancers: RRKnockoutOrderInput[] = [];
  for (const rows of standingsByGroup) {
    const ranked = [...rows].sort((a, b) => a.rank - b.rank || b.points - a.points);
    for (const row of ranked.slice(0, advancementCount)) {
      const stats = statsByUid[row.userId];
      advancers.push({
        uid: row.userId,
        name: row.name,
        groupPoints: row.points,
        pointswon: stats?.pointswon,
        totalPointsPlayed: stats?.totalPointsPlayed,
        rankPosition: stats?.rankPosition,
      });
    }
  }
  return orderRRKnockout(advancers);
};

/**
 * Recursive anchors so seeds meet as late as the draw allows.
 * [1] → [1,2] → [1,4,2,3] → [1,8,4,5,2,7,3,6] …
 * Seed 1 top, seed 2 opposite half, 3 and 4 anchoring the other quarters.
 */
export const seedAnchors = (drawSize: number) => {
  let order = [1];
  while (order.length < drawSize) {
    const n = order.length * 2;
    order = order.flatMap((x) => [x, n + 1 - x]);
  }
  return order;
};

/**
 * Place seeds into the draw. Seed numbers above playerCount become byes, which land
 * opposite the top seeds because the construction pairs k with drawSize + 1 - k.
 */
export const assignByes = (drawSize: number, playerCount: number): Array<number | null> =>
  seedAnchors(drawSize).map((seed) => (seed <= playerCount ? seed : null));

/**
 * Ordered players (index 0 = seed 1) into 1-based seed slots. Slot `k` is seed `k`.
 * Seeds above the field size are omitted so first-round byes land on the top seeds.
 */
export const placeByAnchors = <T>(players: readonly T[], drawSize: number): Map<number, T> => {
  const seated = players.slice(0, drawSize);
  const slots = new Map<number, T>();
  assignByes(drawSize, seated.length).forEach((seed) => {
    if (seed != null) slots.set(seed, seated[seed - 1]!);
  });
  return slots;
};
