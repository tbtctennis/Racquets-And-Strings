import { placeByAnchors, seedCount } from '../../features/tournament/domain/seeding';
import { freezeSeedsAtGeneration } from '../../features/tournament/domain/seedFreeze';
import type {
  DrawDocument,
  ByeAdvance,
  ParticipantSeedUpdate,
} from '../../features/tournament/services/tournamentPersistence';
import type { DrawConfig, TournamentPlayer } from './types';
import { buildMatchFields, fallbackTemplate, getDrawKey, normalizeTemplateMatches } from './utils';

export type KnockoutDrawPlan = {
  documents: DrawDocument[];
  byeAdvances: ByeAdvance[];
  seedUpdates: ParticipantSeedUpdate[];
};

/** Knockout docs placed by seedAnchors. Byes land on the top seeds and auto-advance. */
export const buildKnockoutDrawPlan = (args: {
  eventId: string;
  draw: DrawConfig;
  players: readonly TournamentPlayer[];
  drawsize: number;
  started: boolean;
  slotOverrides?: Record<number, TournamentPlayer | null>;
  freezeSeeds: boolean;
}): KnockoutDrawPlan => {
  const { eventId, draw, drawsize, started, freezeSeeds } = args;
  const slicedPlayers = args.players.slice(0, drawsize);
  const templateMatches = normalizeTemplateMatches(fallbackTemplate(drawsize));
  const slotMap = new Map<number, TournamentPlayer>();
  placeByAnchors(slicedPlayers, drawsize).forEach((player, slot) => slotMap.set(slot, player));

  Object.entries(args.slotOverrides ?? {}).forEach(([slotStr, player]) => {
    const slotNum = Number(slotStr);
    if (player === null) slotMap.delete(slotNum);
    else slotMap.set(slotNum, player);
  });

  const drawKey = getDrawKey(draw.tournamentChoice, draw.division, draw.skillGroup, draw.zone);
  const cfg = {
    eventId,
    tournamentChoice: draw.tournamentChoice,
    division: draw.division,
    skillGroup: draw.skillGroup,
    zone: draw.zone,
    drawsize,
    allMatches: templateMatches,
  };
  const documents = templateMatches.map((tm, index) => ({
    id: `${eventId}_${drawKey}_${tm.match_id}`,
    data: {
      ...buildMatchFields(tm, index, slotMap, cfg),
      bracket: null,
      started,
      created_at: new Date().toISOString(),
    },
  }));

  const byeAdvances: ByeAdvance[] = [];
  templateMatches.forEach((tm) => {
    if (!tm.next_match_id) return;
    const p1 = typeof tm.player_1 === 'number' ? (slotMap.get(tm.player_1) ?? null) : null;
    const p2 = typeof tm.player_2 === 'number' ? (slotMap.get(tm.player_2) ?? null) : null;
    const realPlayer =
      p1 && !p2 && typeof tm.player_2 === 'number' ? p1 : !p1 && p2 && typeof tm.player_1 === 'number' ? p2 : null;
    if (!realPlayer) return;
    let nextSlot = (tm.next_slot || '') as 'player_1' | 'player_2' | '';
    if (!nextSlot) {
      const siblings = templateMatches
        .filter((s) => s.next_match_id === tm.next_match_id)
        .sort((a, b) => templateMatches.indexOf(a) - templateMatches.indexOf(b));
      nextSlot = siblings.findIndex((s) => s.match_id === tm.match_id) <= 0 ? 'player_1' : 'player_2';
    }
    byeAdvances.push({
      nextMatchId: `${eventId}_${drawKey}_${tm.next_match_id}`,
      slot: nextSlot as 'player_1' | 'player_2',
      player: realPlayer,
    });
  });

  const frozenSeeds = freezeSeeds
    ? freezeSeedsAtGeneration(
        slicedPlayers.map((player) => player.uid),
        seedCount(drawsize),
      )
    : new Map<string, number>();
  const seedUpdates = slicedPlayers.flatMap((player) => {
    const seed = frozenSeeds.get(player.uid);
    return player.participantId && seed ? [{ id: player.participantId, seed }] : [];
  });

  return { documents, byeAdvances, seedUpdates };
};
