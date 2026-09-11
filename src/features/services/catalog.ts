import type { ProviderRecord, Redemption, Reward, ServiceCategory } from './types';

/** One Contact button per provider, so the phone number isn't repeated on every offer row. */
export interface Provider {
  id: string;
  name: string;
  area: string;
  phone?: string | undefined;
  email?: string | undefined;
  certified?: boolean | undefined;
  /** Their member account, when they have one — used for the profile photo beside their name. */
  uid?: string | undefined;
  offers: Reward[];
  roles?: ProviderRecord['roles'] | undefined;
}

/** Active catalog rows, preferring `services` over legacy task offers, enriched from providers. */
export const buildCatalogRewards = (
  serviceRewards: Reward[],
  legacyRewards: Reward[],
  providers: ProviderRecord[],
): Reward[] => {
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
  const docs = serviceRewards.length ? serviceRewards : legacyRewards;
  return docs
    .filter((reward) => reward.active !== false)
    .map((reward) => {
      const provider = providerMap.get(reward.provider_id);
      return provider
        ? {
            ...reward,
            provider_name: provider.name || reward.provider_name,
            area: provider.area || reward.area,
            uid: provider.member_uid || reward.uid,
          }
        : reward;
    })
    .sort((a, b) => a.provider_name.localeCompare(b.provider_name) || (a.sort ?? 0) - (b.sort ?? 0));
};

/** Category → providers → offers. Presentation grouping only; no Firestore. */
export const groupRewardsByCategory = (rewards: Reward[]): Map<ServiceCategory, Provider[]> => {
  const cats = new Map<ServiceCategory, Provider[]>();
  rewards.forEach((reward) => {
    const category = reward.category ?? 'stringing';
    const list = cats.get(category) ?? [];
    const existing = list.find((provider) => provider.id === reward.provider_id);
    if (existing) {
      existing.offers.push(reward);
      return;
    }
    list.push({
      id: reward.provider_id,
      name: reward.provider_name,
      area: reward.area,
      phone: reward.contact_phone,
      email: reward.contact_email,
      certified: reward.certified,
      uid: reward.uid,
      offers: [reward],
    });
    cats.set(category, list);
  });
  return cats;
};

export const sortRedemptionsNewestFirst = (items: Redemption[]): Redemption[] =>
  [...items].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
