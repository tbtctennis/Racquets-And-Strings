const { normalizeTournamentResult, scoreFieldPatch, storedTournamentResult } = require('./tournamentResult');

const COMPETITION_CATEGORIES = new Set(['challenge', 'rally']);

function normalizeCompetitionResult(input, match) {
  if (!COMPETITION_CATEGORIES.has(match.category)) {
    throw new Error('Target is not a challenge or rally.');
  }
  return normalizeTournamentResult(input, match);
}

function storedCompetitionResult(match) {
  return storedTournamentResult(match);
}

function competitionPoints(category, winner, loser) {
  if (category === 'challenge') {
    return { [winner]: 3, [loser]: -3 };
  }
  return { [winner]: 2, [loser]: 1 };
}

module.exports = {
  COMPETITION_CATEGORIES,
  competitionPoints,
  normalizeCompetitionResult,
  scoreFieldPatch,
  storedCompetitionResult,
};
