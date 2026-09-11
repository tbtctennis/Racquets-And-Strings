import { useEffect, useState } from 'react';
import { fetchEvents } from '../events/services/eventService';
import { isLadderEvent } from '../../utils/eventTypes';
import { TennisEvent } from '../../types';

export {
  CHALLENGE_BLOCK_LABEL,
  challengeBlockReason,
  isReadyForMatches,
  type ChallengeBlockContext,
  type ChallengeBlockReason,
} from './challengeRules';

/** The active league ladder event, if there is one. */
export function useActiveLadder() {
  const [ladder, setLadder] = useState<TennisEvent | null>(null);
  useEffect(() => {
    fetchEvents()
      .then((all) => setLadder(all.filter((e) => isLadderEvent(e))[0] ?? null))
      .catch(() => {
        /* no ladder — challenging is simply unavailable */
      });
  }, []);
  return ladder;
}
