import { collection, getDocs, query, type QuerySnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { normalizeProvider } from '../../lib/firestoreNormalization';
import { buildCatalogRewards } from './catalog';
import type { ProviderRecord, Reward } from './types';

const toRewards = (snapshot: QuerySnapshot | null): Reward[] =>
  snapshot?.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Reward, 'id'>) })) ?? [];

/** Active catalog from `services`, with legacy task-offer fallback, enriched from `providers`. */
export const loadServicesCatalog = async (): Promise<Reward[]> => {
  const [serviceSnap, legacySnap, providerSnap] = await Promise.all([
    getDocs(query(collection(db, 'services'), where('active', '==', true))).catch(() => null),
    getDocs(query(collection(db, 'tasks'), where('type', '==', 'offer'))).catch(() => null),
    getDocs(collection(db, 'providers')).catch(() => null),
  ]);
  const providers: ProviderRecord[] = [];
  providerSnap?.docs.forEach((providerDoc) => {
    const provider = normalizeProvider(providerDoc.id, providerDoc.data());
    if (provider) providers.push(provider);
  });
  return buildCatalogRewards(toRewards(serviceSnap), toRewards(legacySnap), providers);
};
