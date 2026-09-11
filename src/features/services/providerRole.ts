import type { ProviderRecord, ProviderRole } from './types';

export type ShopProviderRole = Extract<ProviderRole, 'stringer' | 'coach'>;

export type ResolvedProviderRole = {
  providerId: string | null;
  role: ShopProviderRole | null;
};

/** Provider identity comes only from a server-issued providers row. */
export const resolveProviderRole = (provider: ProviderRecord | null): ResolvedProviderRole => {
  const role =
    provider?.roles.find(
      (candidate): candidate is ShopProviderRole => candidate === 'stringer' || candidate === 'coach',
    ) || null;
  return { providerId: provider?.id || null, role };
};
