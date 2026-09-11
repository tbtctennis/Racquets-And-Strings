import type { ContactData } from '../../types';

export interface PoolMember {
  id: string;
  uid: string;
  name: string;
  category: string;
  skill: number;
  created_at: string;
}

/** The narrow, server-created contact projection visible to current pool members. */
export type PoolContact = Partial<
  Pick<
    ContactData,
    'email' | 'phone' | 'preferred_mode_of_contact' | 'whatsapp_contact' | 'whatsapp_same_as_phone' | 'contactable'
  >
>;

export interface PoolHookState<T> {
  value: T;
  loading: boolean;
}
