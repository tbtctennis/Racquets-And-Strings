import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';

export type TournamentResultIntent = {
  matchId: string;
  winnerUid?: string | undefined;
  scores: [[number, number], [number, number], [number, number]];
  walkover?: boolean | undefined;
  court?: string | undefined;
  submissionId?: string | undefined;
};

export type TournamentResultResponse = {
  applied: boolean;
  duplicate: boolean;
  advanced: boolean;
  needsManual: boolean;
  disputed?: boolean | undefined;
  reconciled?: boolean | undefined;
};

/** Apply one organizer-approved result through the server-authoritative transaction. */
export async function applyTournamentResult(intent: TournamentResultIntent) {
  const callable = httpsCallable<TournamentResultIntent, TournamentResultResponse>(functions, 'applyTournamentResult');
  const response = await callable(intent);
  return response.data;
}

export type CompletedResultCorrectionIntent = TournamentResultIntent & {
  reason: string;
};

/** Organizer correction of a completed result: validates state, audits actor/reason/before/after, recomputes. */
export async function correctCompletedResult(intent: CompletedResultCorrectionIntent) {
  const callable = httpsCallable<CompletedResultCorrectionIntent, TournamentResultResponse>(
    functions,
    'correctCompletedResult',
  );
  const response = await callable(intent);
  return response.data;
}

export async function setGroupBonus(args: {
  eventId: string;
  rrGroup: number;
  award: boolean;
  tournamentChoice?: string | undefined;
  division?: string | undefined;
  skillGroup?: string | undefined;
  zone?: string | null | undefined;
}) {
  const callable = httpsCallable<typeof args, { applied: boolean; awarded: boolean }>(functions, 'setGroupBonus');
  const response = await callable(args);
  return response.data;
}
