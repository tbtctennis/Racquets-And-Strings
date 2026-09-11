/**
 * Tournament scoring helpers. Keep this module free of React and Firestore.
 */

/** Absolute player_1/player_2 score fields for tournament, ladder, and rally results. */
export const setFieldsFrom = (pairs: [number, number][]) => ({
  set_1_player_1: pairs[0]?.[0] ?? 0,
  set_1_player_2: pairs[0]?.[1] ?? 0,
  set_2_player_1: pairs[1]?.[0] ?? 0,
  set_2_player_2: pairs[1]?.[1] ?? 0,
  set_3_player_1: pairs[2]?.[0] ?? 0,
  set_3_player_2: pairs[2]?.[1] ?? 0,
});
