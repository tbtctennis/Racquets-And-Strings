import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../tasks/useTasks';
import { normalizeProvider } from '../../lib/firestoreNormalization';
import { groupRewardsByCategory, sortRedemptionsNewestFirst } from './catalog';
import { resolveProviderRole } from './providerRole';
import { loadServicesCatalog } from './servicesRepository';
import { Booking, MIN_REWARD_COST, ProviderRecord, Redemption, Reward } from './types';

export * from './types';
export type { Provider } from './catalog';

/** The services catalog, active entries only, grouped by category then provider. */
export function useServicesCatalog() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    loadServicesCatalog()
      .then(setRewards)
      .catch(() => {
        /* catalog unreadable — the page shows its empty state */
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const byCategory = useMemo(() => groupRewardsByCategory(rewards), [rewards]);

  return { rewards, byCategory, loading, reload: () => setReloadKey((k) => k + 1) };
}

/**
 * Provider profile photos, keyed by uid. One `users/{uid}` read per linked provider (a handful,
 * publicly readable), cached for the session so switching Marketplace tabs doesn't re-fetch.
 */
const avatarCache = new Map<string, string>();

export function useProviderAvatars(uids: (string | undefined)[]): Record<string, string> {
  const key = [...new Set(uids.filter((u): u is string => !!u))].sort().join(',');
  const [avatars, setAvatars] = useState<Record<string, string>>(() => Object.fromEntries(avatarCache));

  useEffect(() => {
    const missing = (key ? key.split(',') : []).filter((u) => !avatarCache.has(u));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map((u) => getDoc(doc(db, 'users', u)).then((s) => [u, s.data()?.avatar as string | undefined] as const)),
    )
      .then((entries) => {
        entries.forEach(([u, url]) => {
          if (url) avatarCache.set(u, url);
        });
        if (!cancelled) setAvatars(Object.fromEntries(avatarCache));
      })
      .catch(() => {
        /* no photo — the row falls back to an initial */
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return avatars;
}

/** How many catalogue rewards the current balance can cover. */
export function rewardsAvailable(redeemable: number): number {
  return Math.floor(Math.max(0, redeemable) / MIN_REWARD_COST);
}

/**
 * The signed-in player's offers balance. earned = league + RS points; spent comes from
 * offers/{uid}, written only by Cloud Functions. Redeeming moves `spent` and nothing else, so the
 * earning counters and every leaderboard on them are untouched.
 * Mirrors readBalance() in functions/rewards.js — change one, change both.
 */
export function useRedeemablePoints() {
  const { user, profile } = useAuth();
  const { points: rsPoints, progressLoaded } = useTasks();
  const [spent, setSpent] = useState(0);
  const [spentLoaded, setSpentLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setSpent(0);
      setSpentLoaded(true);
      return;
    }
    return onSnapshot(
      doc(db, 'offers', user.uid),
      (snap) => {
        const v = snap.exists() ? snap.data().pointsSpent : 0;
        setSpent(typeof v === 'number' ? v : 0);
        setSpentLoaded(true);
      },
      () => setSpentLoaded(true),
    );
  }, [user?.uid]);

  // Logged out: a flat zero balance, resolved immediately. useTasks() never flips
  // progressLoaded without a user, so deriving `loading` from it would leave signed-out
  // visitors on a permanent placeholder instead of showing them 0.
  if (!user) {
    return { earned: 0, leaguePoints: 0, rsPoints: 0, spent: 0, balance: 0, loading: false };
  }

  const leaguePoints = profile?.stats?.leaguePoints26 ?? 0;
  const earned = Math.max(0, Math.round(leaguePoints + rsPoints));
  return {
    earned,
    leaguePoints,
    rsPoints,
    spent,
    balance: earned - spent,
    loading: !progressLoaded || !spentLoaded,
  };
}

/** The signed-in player's own coupons, newest first. */
export function useMyRedemptions() {
  const { user } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRedemptions([]);
      setLoading(false);
      return;
    }
    return onSnapshot(
      query(collection(db, 'redemptions'), where('uid', '==', user.uid)),
      (snap) => {
        setRedemptions(sortRedemptionsNewestFirst(snap.docs.map((d) => d.data() as Redemption)));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user?.uid]);

  return { redemptions, loading };
}

/** The signed-in player's own service bookings. Partitioning into open/past is client-side. */
export function useMyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }
    return onSnapshot(
      query(collection(db, 'bookings'), where('uid', '==', user.uid)),
      (snap) => {
        setBookings(snap.docs.map((d) => ({ ...(d.data() as Booking), id: d.id })));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user?.uid]);

  return { bookings, loading };
}

/** The provider id this account owns, if any. Only a server-issued providers row grants it. */
export function useProviderRole() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderRecord | null>(null);

  useEffect(() => {
    if (!user) {
      setProvider(null);
      return;
    }
    return onSnapshot(
      query(collection(db, 'providers'), where('member_uid', '==', user.uid)),
      (snap) => {
        const record = snap.docs.map((d) => normalizeProvider(d.id, d.data())).find(Boolean) || null;
        setProvider(record);
      },
      () => setProvider(null),
    );
  }, [user?.uid]);

  return resolveProviderRole(provider);
}

/** Coupons issued against the signed-in provider's own offers. */
export function useProviderRedemptions() {
  const { providerId, role } = useProviderRole();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) {
      setRedemptions([]);
      setLoading(false);
      return;
    }
    // Sorted client-side rather than with orderBy: pairing orderBy with the id filter would
    // need a composite index, and this project ships no firestore.indexes.json.
    return onSnapshot(
      query(collection(db, 'redemptions'), where('stringer_id', '==', providerId)),
      (snap) => {
        setRedemptions(sortRedemptionsNewestFirst(snap.docs.map((d) => d.data() as Redemption)));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [providerId]);

  return { providerId, role, redemptions, loading };
}

/** Redemptions needing an organizer decision — flagged by a provider or cancel-requested. */
export function usePendingRedemptionReviews(enabled: boolean) {
  const [items, setItems] = useState<Redemption[]>([]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }
    return onSnapshot(
      query(collection(db, 'redemptions'), where('status', 'in', ['flagged', 'cancel_requested'])),
      (snap) => setItems(snap.docs.map((d) => d.data() as Redemption)),
      () => setItems([]),
    );
  }, [enabled]);

  return items;
}
