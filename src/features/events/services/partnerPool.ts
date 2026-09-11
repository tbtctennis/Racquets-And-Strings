import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { usePool, usePoolContacts } from '../../partnerPool/usePool';

export type PartnerPoolCategory = 'mens' | 'womens' | 'mixed';

export const poolCategoryForDivision = (division = ''): PartnerPoolCategory => {
  const normalized = division.toLowerCase();
  if (normalized.includes('women')) return 'womens';
  if (normalized.includes('mixed')) return 'mixed';
  return 'mens';
};

export async function joinPool(args: {
  eventId: string;
  uid: string;
  name: string;
  category: PartnerPoolCategory;
  skill: number;
}): Promise<void> {
  const memberRef = doc(db, 'partner_pool', args.eventId, 'members', args.uid);
  if ((await getDoc(memberRef)).exists()) return;
  await setDoc(memberRef, {
    uid: args.uid,
    name: args.name.trim() || 'Player',
    category: args.category,
    skill: Number.isFinite(args.skill) ? args.skill : 0,
    created_at: new Date().toISOString(),
  });
}

export const leavePool = (eventId: string, uid: string) => deleteDoc(doc(db, 'partner_pool', eventId, 'members', uid));

export { usePool, usePoolContacts };
