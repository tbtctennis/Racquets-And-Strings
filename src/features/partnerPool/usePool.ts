import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type { PoolContact, PoolHookState, PoolMember } from './types';
import { normalizePoolContact, normalizePoolMember } from './normalization';

const emptyPoolState = (): PoolHookState<PoolMember[]> => ({ value: [], loading: false });

/** Live membership list for an event. Membership data is safe to read for signed-in users. */
export function usePool(eventId: string, category?: string): { members: PoolMember[]; loading: boolean } {
  const { user } = useAuth();
  const [state, setState] = useState<PoolHookState<PoolMember[]>>(() => emptyPoolState());

  useEffect(() => {
    if (!user || !eventId.trim()) {
      setState(emptyPoolState());
      return;
    }

    setState({ value: [], loading: true });
    const members = collection(db, 'partner_pool', eventId, 'members');
    // Keep this index-free. The pool is intentionally small and the server only needs to expose
    // membership; ordering is stable and cheap to do after the narrow read.
    const membersQuery = category?.trim() ? query(members, where('category', '==', category.trim())) : members;

    return onSnapshot(
      membersQuery,
      (snapshot) => {
        setState({
          value: snapshot.docs
            .flatMap((document) => {
              const member = normalizePoolMember(document.id, document.data());
              return member ? [member] : [];
            })
            .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.name.localeCompare(b.name)),
          loading: false,
        });
      },
      () => setState({ value: [], loading: false }),
    );
  }, [category, eventId, user?.uid]);

  return { members: state.value, loading: state.loading };
}

/**
 * Live pool contacts keyed by UID. Contact reads intentionally fail closed: Firestore denies the
 * collection to non-members, and that denial must look exactly like an empty contact list to the
 * panel rather than exposing a permission error or stale contact data.
 */
export function usePoolContacts(eventId: string): { contacts: Record<string, PoolContact>; loading: boolean } {
  const { user } = useAuth();
  const [state, setState] = useState<PoolHookState<Record<string, PoolContact>>>({ value: {}, loading: false });

  useEffect(() => {
    if (!user || !eventId.trim()) {
      setState({ value: {}, loading: false });
      return;
    }

    setState({ value: {}, loading: true });
    return onSnapshot(
      collection(db, 'partner_pool', eventId, 'contacts'),
      (snapshot) => {
        const contacts = Object.fromEntries(
          snapshot.docs.map((document) => [document.id, normalizePoolContact(document.data())]),
        );
        setState({ value: contacts, loading: false });
      },
      () => setState({ value: {}, loading: false }),
    );
  }, [eventId, user?.uid]);

  return { contacts: state.value, loading: state.loading };
}

export type { PoolContact, PoolHookState, PoolMember } from './types';
export { normalizePoolContact, normalizePoolMember } from './normalization';
