/** One selected treatment (R-3 / D7-SW-T3). Unselected is recessed — darker than the card in both themes. */
export const CONTROL_SELECTED = 'bg-clay text-white';
export const CONTROL_UNSELECTED = 'bg-tennis-deep text-fg hover:bg-tennis-deep/80';

export function controlChrome(selected: boolean): string {
  return selected ? CONTROL_SELECTED : CONTROL_UNSELECTED;
}
