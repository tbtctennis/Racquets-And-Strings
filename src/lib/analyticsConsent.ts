export type AnalyticsConsent = 'granted' | 'denied';

const STORAGE_KEY = 'rs-analytics-consent';

const listeners = new Set<() => void>();
let memoryChoice: AnalyticsConsent | null = null;

function readStoredChoice(): AnalyticsConsent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'granted' || value === 'denied') return value;
  } catch {
    /* localStorage unavailable (private mode, tests, etc.) */
  }
  return memoryChoice;
}

/** Last Accept / Decline decision, or null if the member has not chosen yet. */
export const getAnalyticsConsent = (): AnalyticsConsent | null => readStoredChoice();

export const hasAnalyticsConsent = (): boolean => readStoredChoice() === 'granted';

/** Persist the choice and notify waiters (analytics init, banner). */
export const setAnalyticsConsent = (granted: boolean): void => {
  const value: AnalyticsConsent = granted ? 'granted' : 'denied';
  memoryChoice = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* best-effort; memoryChoice still holds for this session */
  }
  listeners.forEach((listener) => listener());
};

export const subscribeAnalyticsConsent = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Resolves true on Accept, false on Decline. Already-stored choices resolve immediately. */
export const waitForAnalyticsConsent = (): Promise<boolean> => {
  const existing = readStoredChoice();
  if (existing === 'granted') return Promise.resolve(true);
  if (existing === 'denied') return Promise.resolve(false);
  return new Promise((resolve) => {
    const unsubscribe = subscribeAnalyticsConsent(() => {
      const choice = readStoredChoice();
      if (!choice) return;
      unsubscribe();
      resolve(choice === 'granted');
    });
  });
};
