export type ListboxKeyAction =
  | { type: 'move'; index: number }
  | { type: 'select'; index: number }
  | { type: 'close' }
  | { type: 'open'; index: number };

/** Arrow/Enter/Escape handling shared by member pickers and court comboboxes. */
export function listboxKeyAction(
  key: string,
  itemCount: number,
  activeIndex: number,
  open: boolean,
): ListboxKeyAction | null {
  const last = Math.max(itemCount - 1, 0);
  switch (key) {
    case 'ArrowDown':
      if (!open) return { type: 'open', index: 0 };
      return { type: 'move', index: Math.min(activeIndex + 1, last) };
    case 'ArrowUp':
      if (!open) return { type: 'open', index: last };
      return { type: 'move', index: Math.max(activeIndex - 1, 0) };
    case 'Home':
      if (!open) return { type: 'open', index: 0 };
      return { type: 'move', index: 0 };
    case 'End':
      if (!open) return { type: 'open', index: last };
      return { type: 'move', index: last };
    case 'Enter':
      if (open && itemCount > 0) return { type: 'select', index: activeIndex };
      return null;
    case 'Escape':
      if (open) return { type: 'close' };
      return null;
    default:
      return null;
  }
}
