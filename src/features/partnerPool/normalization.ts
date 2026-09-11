import type { ContactMethod } from '../../types';
import type { PoolContact, PoolMember } from './types';

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown): UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {};
const stringValue = (value: unknown, fallback = '') => (typeof value === 'string' ? value.trim() : fallback);
const numberValue = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export const normalizePoolMember = (id: string, value: unknown): PoolMember | null => {
  const data = record(value);
  const uid = stringValue(data.uid);
  if (!id.trim() || !uid || uid !== id) return null;
  return {
    id,
    uid,
    name: stringValue(data.name, 'Player'),
    category: stringValue(data.category, 'doubles'),
    skill: numberValue(data.skill),
    created_at: stringValue(data.created_at),
  };
};

const CONTACT_METHODS = new Set(['email', 'text', 'whatsapp']);
export const normalizePoolContact = (value: unknown): PoolContact => {
  const data = record(value);
  const preferred = Array.isArray(data.preferred_mode_of_contact)
    ? data.preferred_mode_of_contact.filter(
        (method): method is ContactMethod => typeof method === 'string' && CONTACT_METHODS.has(method),
      )
    : undefined;
  return {
    ...(stringValue(data.email) ? { email: stringValue(data.email) } : {}),
    ...(stringValue(data.phone) ? { phone: stringValue(data.phone) } : {}),
    ...(preferred?.length ? { preferred_mode_of_contact: preferred } : {}),
    ...(stringValue(data.whatsapp_contact) ? { whatsapp_contact: stringValue(data.whatsapp_contact) } : {}),
    ...(data.whatsapp_same_as_phone === true && stringValue(data.phone) ? { whatsapp_same_as_phone: true } : {}),
    ...(data.contactable === true ? { contactable: true } : {}),
  };
};
