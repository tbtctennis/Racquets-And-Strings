import { useCallback, useState } from 'react';

/** One player-row disclosure at a time. Tapping the open row closes it. */
export const nextExpandedId = (current: string | null, id: string): string | null => (current === id ? null : id);

export const useExpandedRow = (initial: string | null = null) => {
  const [expandedId, setExpandedId] = useState<string | null>(initial);
  const toggle = useCallback((id: string) => {
    setExpandedId((current) => nextExpandedId(current, id));
  }, []);
  return { expandedId, toggle };
};
