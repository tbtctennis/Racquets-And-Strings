import { collection, onSnapshot, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, functions } from '../../lib/firebase';
import {
  COURT_RESOLUTION_AUDIT_COLLECTION,
  COURT_RESOLUTIONS_COLLECTION,
  courtResolutionCoords,
  courtResolutionNames,
  courtResolutionZoneMap,
  type CourtResolution,
  type CourtResolutionAudit,
} from './resolution';

const resolveCourtZoneCallable = httpsCallable(functions, 'resolveCourtZone');

export function useCourtResolutions(): {
  resolutions: CourtResolution[];
  names: string[];
  zones: Map<string, string>;
  coords: Map<string, { lat: number; lng: number }>;
  loading: boolean;
} {
  const { user } = useAuth();
  const [resolutions, setResolutions] = useState<CourtResolution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setResolutions([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, COURT_RESOLUTIONS_COLLECTION)),
      (snap) => {
        setResolutions(
          snap.docs.map((docSnap) => ({
            court_key: docSnap.id,
            ...(docSnap.data() as Omit<CourtResolution, 'court_key'>),
          })),
        );
        setLoading(false);
      },
      () => {
        setResolutions([]);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  const names = useMemo(() => courtResolutionNames(resolutions), [resolutions]);
  const zones = useMemo(() => courtResolutionZoneMap(resolutions), [resolutions]);
  const coords = useMemo(() => courtResolutionCoords(resolutions), [resolutions]);

  return { resolutions, names, zones, coords, loading };
}

export function useCourtResolutionAudit(): { audit: CourtResolutionAudit[]; loading: boolean } {
  const { user } = useAuth();
  const [audit, setAudit] = useState<CourtResolutionAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAudit([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, COURT_RESOLUTION_AUDIT_COLLECTION)),
      (snap) => {
        const rows = snap.docs
          .map((docSnap) => docSnap.data() as CourtResolutionAudit)
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
        setAudit(rows);
        setLoading(false);
      },
      () => {
        setAudit([]);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  return { audit, loading };
}

export async function resolveCourtZone(input: {
  name: string;
  zone: string;
  lat?: number;
  lng?: number;
}): Promise<{ court_key: string; zone: string }> {
  const result = await resolveCourtZoneCallable(input);
  return result.data as { court_key: string; zone: string };
}

export const courtResolutionErrorMessage = (err: unknown): string => {
  const msg = (err as { message?: string })?.message;
  return msg && !msg.startsWith('INTERNAL') ? msg : 'Could not save the court. Try again.';
};
