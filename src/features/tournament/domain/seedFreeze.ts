import { PLAYER_LOADING } from '../types';

export type SeedEntry = { uid: string; seed?: number };

export type SeedMoveReason = 'seeded-player' | 'seeded-occupant' | 'slot-not-open' | 'reseed-forbidden';

export type SeedMoveDecision = { ok: true } | { ok: false; reason: SeedMoveReason };

export const isPositiveSeed = (seed?: number): seed is number =>
  typeof seed === 'number' && Number.isInteger(seed) && seed > 0;

export const isOpenDrawPosition = (uid?: string | null, name?: string | null): boolean =>
  !uid && (!name || name === PLAYER_LOADING);

/** Ranked strongest-first. Ungenerated joins renumber 1..seedCount; generated joins keep existing seeds. */
export function assignSeedsOnJoin(ranked: readonly SeedEntry[], generated: boolean, seedCount: number): SeedEntry[] {
  if (generated) {
    return ranked.map((player) =>
      isPositiveSeed(player.seed) ? { uid: player.uid, seed: player.seed } : { uid: player.uid },
    );
  }
  return ranked.map((player, index) =>
    index < seedCount ? { uid: player.uid, seed: index + 1 } : { uid: player.uid },
  );
}

export function freezeSeedsAtGeneration(rankedUids: readonly string[], seedCount: number): Map<string, number> {
  const seeds = new Map<string, number>();
  assignSeedsOnJoin(
    rankedUids.map((uid) => ({ uid })),
    false,
    seedCount,
  ).forEach((player) => {
    if (isPositiveSeed(player.seed)) seeds.set(player.uid, player.seed);
  });
  return seeds;
}

export function canReseedDraw(generated: boolean): boolean {
  return !generated;
}

export function canMoveInDraw(input: {
  generated: boolean;
  playerUid?: string;
  playerSeed?: number;
  playerAlreadySeated: boolean;
  occupantUid?: string;
  occupantSeed?: number;
  targetOpen: boolean;
}): SeedMoveDecision {
  if (!input.generated) return { ok: true };
  if (input.playerUid && input.playerUid === input.occupantUid) return { ok: true };
  if (isPositiveSeed(input.occupantSeed)) return { ok: false, reason: 'seeded-occupant' };
  if (!input.playerUid) return { ok: true };
  if (isPositiveSeed(input.playerSeed) && input.playerAlreadySeated) {
    return { ok: false, reason: 'seeded-player' };
  }
  if (!input.targetOpen) return { ok: false, reason: 'slot-not-open' };
  return { ok: true };
}

export const seedMoveBlockedMessage = (reason: SeedMoveReason): string => {
  if (reason === 'slot-not-open') return 'Unseeded players can only move to an open position.';
  if (reason === 'reseed-forbidden') return 'Seeds are frozen once the draw is generated.';
  return 'Seeded players keep their place in the draw.';
};
