import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BadgeCheck, Check, Copy, Flag, Pencil, Plus, Trash2, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { EntityCard } from '../../components/EntityCard';
import { Avatar } from '../../components/Avatar';
import { field, fieldLabelCls } from '../../components/Input';
import { Fab } from '../../components/Fab';
import { SelectSheet } from '../../components/SelectSheet';
import { Sheet } from '../../components/Sheet';
import { Tree, TreeGroup } from '../../components/Tree';
import { Checkbox } from '../../components/Checkbox';
import { EmptyState } from '../../components/EmptyState';
import { AlertMessage } from '../../components/AlertMessage';
import { FieldError } from '../../components/FieldError';
import { ReviewPanel } from '../../components/ReviewPanel';
import { StatGrid } from '../../components/StatGrid';
import { Pill } from '../../components/Pill';
import { ContactOpponentButton } from '../../components/ContactOpponentButton';
import { fadeUp, tapScale } from '../../lib/motion';
import { controlChrome } from '../../lib/controlChrome';
import {
  CATEGORY_LABEL,
  MIN_REWARD_COST,
  Provider,
  Redemption,
  Reward,
  ServiceCategory,
  useMyBookings,
  useMyRedemptions,
  useProviderAvatars,
  useProviderRedemptions,
  useProviderRole,
  useRedeemablePoints,
  useServicesCatalog,
} from '../../features/services/useServices';
import { BookingsList } from '../../features/services/BookingsList';
import {
  flagCoupon,
  bookService,
  markCouponUsed,
  redeemReward,
  requestCancellation,
  serviceErrorMessage,
} from '../../features/services/servicesApi';
import { createOffer, deactivateOffer, updateOffer } from '../../features/services/adminApi';
import { useConfirmSheet } from '../../components/useConfirmSheet';

// Services tab and offer form. Group lessons are retired; lessons are now event add-ons.

// ─── Add / edit an offer (super-admin only) ──────────────────────────────────────────────────────

// Compact field chrome, matching Add an Event: one size for every field in the sheet.
const fieldCls = `${field} bg-tennis-dark/70`;
const labelCls = fieldLabelCls;

type LinkCandidate = { uid: string; name: string };

export const AddServiceForm: React.FC<{
  byCategory: Map<ServiceCategory, Provider[]>;
  editingReward?: Reward;
  onClose: () => void;
  onCreated: () => void;
}> = ({ byCategory, editingReward, onClose, onCreated }) => {
  const isEditing = !!editingReward;
  const [category, setCategory] = useState<ServiceCategory>(editingReward?.category ?? 'stringing');
  const [providerMode, setProviderMode] = useState<'existing' | 'new'>('existing');
  const [providerId, setProviderId] = useState(editingReward?.provider_id ?? '');
  const [providerName, setProviderName] = useState(editingReward?.provider_name ?? '');
  const [area, setArea] = useState(editingReward?.area ?? '');
  const [phone, setPhone] = useState(editingReward?.contact_phone ?? '');
  const [email, setEmail] = useState(editingReward?.contact_email ?? '');
  const [certified, setCertified] = useState(!!editingReward?.certified);

  const [offer, setOffer] = useState(editingReward?.offer ?? '');
  const [brandInput, setBrandInput] = useState('');
  const [brands, setBrands] = useState<string[]>(
    editingReward?.brands
      ? editingReward.brands
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : [],
  );
  const [totalPrice, setTotalPrice] = useState(editingReward ? String(editingReward.total_price) : '');
  const [discount, setDiscount] = useState(editingReward ? String(editingReward.discount) : '');
  const [pointsCost, setPointsCost] = useState(editingReward ? String(editingReward.points_cost) : '');

  const [linkSearch, setLinkSearch] = useState('');
  const [linkUid, setLinkUid] = useState(editingReward?.uid ?? '');
  const [linkName, setLinkName] = useState('');
  const [candidates, setCandidates] = useState<LinkCandidate[]>([]);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const providersInCategory = useMemo(() => byCategory.get(category) ?? [], [byCategory, category]);

  useEffect(() => {
    // Loaded once, lazily, only when the account-link picker is actually used — `users` is
    // world-readable, and this keeps the common (no linking) case free of an extra read.
    if (linkSearch.trim().length < 2 || candidates.length > 0) return;
    getDocs(collection(db, 'users'))
      .then((snap) => {
        setCandidates(snap.docs.map((d) => ({ uid: d.id, name: (d.data().name as string) || '' })));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkSearch]);

  const linkMatches =
    linkSearch.trim().length < 2
      ? []
      : candidates.filter((c) => c.name.toLowerCase().includes(linkSearch.trim().toLowerCase())).slice(0, 6);

  const addBrand = () => {
    const b = brandInput.trim();
    if (!b || brands.includes(b)) return;
    setBrands([...brands, b]);
    setBrandInput('');
  };

  const priceNum = Number(totalPrice);
  const discountNum = Number(discount) || 0;
  const pointsNum = Number(pointsCost);
  const discountedPrice = Number.isFinite(priceNum) ? Math.max(0, priceNum - discountNum) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const name = isEditing
      ? editingReward!.provider_name
      : providerMode === 'existing'
        ? providersInCategory.find((p) => p.id === providerId)?.name || ''
        : providerName.trim();
    if (!name) {
      setError('Choose a provider, or enter a new provider name.');
      return;
    }
    if (!offer.trim()) {
      setError('Enter an offer title.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Enter a valid price.');
      return;
    }
    if (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > priceNum) {
      setError('Discount must be between 0 and the price.');
      return;
    }
    if (!Number.isFinite(pointsNum) || pointsNum <= 0) {
      setError('Enter the points required.');
      return;
    }
    if (!isEditing && providerMode === 'new' && !area.trim()) {
      setError("Enter the new provider's area.");
      return;
    }
    if (isEditing && !area.trim()) {
      setError("Enter the provider's area.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateOffer(editingReward!.id, editingReward!.provider_id, {
          category,
          providerName: name,
          area: area.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          certified,
          offer: offer.trim(),
          brands: brands.length > 0 ? brands.join(', ') : undefined,
          totalPrice: priceNum,
          discount: discountNum,
          pointsCost: pointsNum,
          linkUid: linkUid || undefined,
        });
      } else {
        await createOffer({
          category,
          providerId: providerMode === 'existing' ? providerId : undefined,
          providerName: name,
          area:
            providerMode === 'existing'
              ? providersInCategory.find((p) => p.id === providerId)?.area || ''
              : area.trim(),
          phone: providerMode === 'new' ? phone.trim() || undefined : undefined,
          email: providerMode === 'new' ? email.trim() || undefined : undefined,
          certified: providerMode === 'new' ? certified : undefined,
          offer: offer.trim(),
          brands: brands.length > 0 ? brands.join(', ') : undefined,
          totalPrice: priceNum,
          discount: discountNum,
          pointsCost: pointsNum,
          linkUid: linkUid || undefined,
        });
      }
      onCreated();
      onClose();
    } catch {
      setError(`Could not ${isEditing ? 'save' : 'add'} the service. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet onClose={onClose} title={isEditing ? 'Edit service' : 'Add a service'} maxWidthClassName="max-w-md">
      <form onSubmit={submit} className="p-5 pt-2 space-y-3">
        {error && <AlertMessage tone="error">{error}</AlertMessage>}

        <div>
          <label className={labelCls}>Type</label>
          <div className="flex gap-2">
            {(['stringing', 'coaching', 'others'] as ServiceCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setProviderId('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${controlChrome(category === c)}`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="offer-provider">
            Provider
          </label>
          {isEditing ? (
            // Editing keeps the offer under the same provider row — only its details change.
            <div className="space-y-2">
              <p className="text-sm font-bold text-fg">{editingReward!.provider_name}</p>
              <input
                className={fieldCls}
                placeholder="Area"
                aria-label="Area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={fieldCls}
                  placeholder="Phone"
                  aria-label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  className={fieldCls}
                  placeholder="Email"
                  aria-label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {category === 'coaching' && <Checkbox checked={certified} onChange={setCertified} label="Certified" />}
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setProviderMode('existing')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${controlChrome(providerMode === 'existing')}`}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setProviderMode('new')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${controlChrome(providerMode === 'new')}`}
                >
                  New provider
                </button>
              </div>

              {providerMode === 'existing' ? (
                <SelectSheet
                  label="Provider"
                  value={providerId}
                  options={providersInCategory.map((p) => ({ value: p.id, label: p.name }))}
                  onChange={setProviderId}
                  emptyLabel="Select a provider…"
                  hideLabel
                  className={fieldCls}
                />
              ) : (
                <div className="space-y-2">
                  <input
                    className={fieldCls}
                    placeholder="Provider name"
                    aria-label="Provider name"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                  />
                  <input
                    className={fieldCls}
                    placeholder="Area (e.g. Downtown Toronto)"
                    aria-label="Area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className={fieldCls}
                      placeholder="Phone (optional)"
                      aria-label="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <input
                      className={fieldCls}
                      placeholder="Email (optional)"
                      aria-label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {category === 'coaching' && (
                    <Checkbox checked={certified} onChange={setCertified} label="Certified" />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className={labelCls} htmlFor="offer-link">
            Link to an account
          </label>
          {linkUid ? (
            <div className="flex items-center justify-between rounded-xl bg-fg/5 px-3.5 py-2.5">
              <span className="text-sm text-fg font-semibold">{linkName || 'Linked account'}</span>
              <button
                type="button"
                onClick={() => {
                  setLinkUid('');
                  setLinkName('');
                  setLinkSearch('');
                }}
                aria-label={`Remove ${linkName || 'linked account'}`}
                className="text-fg/70 hover:text-fg focus-visible"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                id="offer-link"
                className={fieldCls}
                placeholder="Search by name…"
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
              />
              {linkMatches.length > 0 && (
                <div className="mt-1.5 rounded-xl border border-fg/10 bg-tennis-dark/95 overflow-hidden">
                  {linkMatches.map((c) => (
                    <button
                      key={c.uid}
                      type="button"
                      onClick={() => {
                        setLinkUid(c.uid);
                        setLinkName(c.name);
                        setLinkSearch('');
                      }}
                      className="w-full text-left px-3.5 py-2 text-sm text-fg/80 hover:bg-clay/20 transition-colors"
                    >
                      {c.name || '(no name)'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelCls} htmlFor="offer-title">
            Offer title
          </label>
          <input
            id="offer-title"
            className={fieldCls}
            placeholder="Mid-level Strings Replacement"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="offer-brands">
            Brands
          </label>
          {brands.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {brands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full bg-fg/[0.06] pl-2.5 pr-1.5 py-1 text-xs text-fg/70"
                >
                  {b}
                  <button
                    type="button"
                    onClick={() => setBrands(brands.filter((x) => x !== b))}
                    aria-label={`Remove ${b}`}
                    className="text-fg/70 hover:text-fg focus-visible"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              id="offer-brands"
              className={fieldCls}
              placeholder="Add a brand…"
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBrand();
                }
              }}
            />
            <Button
              type="button"
              variant="clay"
              className="px-3 shrink-0"
              onClick={addBrand}
              disabled={!brandInput.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        <StatGrid>
          <div>
            <label className={labelCls} htmlFor="offer-price">
              Price
            </label>
            <input
              id="offer-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="40"
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="offer-discount">
              Discount
            </label>
            <input
              id="offer-discount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="5"
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="offer-points">
              Points
            </label>
            <input
              id="offer-points"
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={pointsCost}
              onChange={(e) => setPointsCost(e.target.value)}
              placeholder="15"
              className={fieldCls}
            />
          </div>
        </StatGrid>
        {discountedPrice !== null && (
          <p className="text-xs text-fg/70">
            Shown to members as ${discountedPrice} with {pointsCost || '—'} points, off a ${priceNum} regular price.
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="clay" isLoading={saving} className="flex-1">
            {isEditing ? 'Save' : 'Add'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
};

// ─── The Services tab ────────────────────────────────────────────────────────────────────────────

// The callable enforces this again server-side. The UI only exposes the form to an account that
// owns a provider row or the configured super-admin; a devtools toggle cannot grant write access.
const SUPER_ADMIN_UID = '7PvfzNtDmsOq5GLMieId7QRT7wH3';

const money = (n: number | null | undefined) => (typeof n === 'number' ? `$${n % 1 === 0 ? n : n.toFixed(2)}` : '—');

// ─── One offer ──────────────────────────────────────────────────────────────────────────────

// The regular price is the headline so members can compare providers at a glance and just book
// at full price if they'd rather not spend points. The discount is the secondary line.
const OfferCard: React.FC<{
  reward: Reward;
  balance: number;
  alreadyOpen: boolean;
  busy: boolean;
  onBook: () => void;
  onRedeem: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ reward, balance, alreadyOpen, busy, onBook, onRedeem, onEdit, onDelete }) => {
  const affordable = balance >= reward.points_cost;

  return (
    <EntityCard
      title={
        <>
          <p className="text-sm font-bold text-fg leading-snug">{reward.offer}</p>
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                type="button"
                aria-label="Edit offer"
                onClick={onEdit}
                className="text-fg/70 hover:text-fg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label="Remove offer"
                onClick={onDelete}
                className="text-fg/70 hover:text-badge-loss transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-xl font-black text-fg leading-none">{money(reward.total_price)}</span>
          </div>
        </>
      }
      pills={
        reward.brands
          ? reward.brands
              .split(',')
              .map((b) => b.trim())
              .filter(Boolean)
              .map((b) => (
                <span key={b} className="text-xs font-medium text-fg/70 bg-fg/[0.06] rounded-full px-2.5 py-0.5">
                  {b}
                </span>
              ))
          : undefined
      }
      footerMeta={
        <>
          <span className="text-xs text-fg/70">
            {money(reward.discounted_price)} with {reward.points_cost} points
          </span>
          {!affordable && !alreadyOpen && (
            <p className="text-xs text-fg/70 mt-2">
              Needs {reward.points_cost} points. You can also book at the regular price above.
            </p>
          )}
        </>
      }
      footerAction={
        <>
          <Button size="sm" variant="outline" onClick={onBook} disabled={busy}>
            Book
          </Button>
          <Button
            size="sm"
            variant="clay"
            onClick={onRedeem}
            disabled={!affordable || alreadyOpen || busy}
            isLoading={busy}
          >
            {alreadyOpen ? 'Coupon open' : `Redeem a ${money(reward.discount)} discount`}
          </Button>
        </>
      }
    />
  );
};

// ─── Provider photo ─────────────────────────────────────────────────────────────────────────

// The provider's own uploaded profile photo, resolved through the uid stamped on their offers.
// Falls back to their initial, so a provider without a member account (or without a photo) still
// gets the same round marker and the rows stay aligned.
const ProviderAvatar: React.FC<{ name: string; src?: string }> = ({ name, src }) => (
  <Avatar src={src} name={name} size="row" className="bg-fg/10 text-fg/70" />
);

// ─── One issued coupon (player's view) ──────────────────────────────────────────────────────

const CouponCard: React.FC<{ r: Redemption; onCancel: (code: string) => void; busy: boolean }> = ({
  r,
  onCancel,
  busy,
}) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(r.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        /* clipboard blocked — the code is on screen anyway */
      });
  };

  const label = r.status === 'cancel_requested' ? 'Cancelling' : r.status === 'flagged' ? 'Flagged' : 'Active';

  return (
    <EntityCard
      className="bg-clay/[0.08] border border-clay/45"
      title={
        <>
          <p className="text-sm font-bold text-fg leading-snug">{r.offer}</p>
          <span className="shrink-0 text-xs font-black uppercase tracking-wide bg-clay text-white rounded-full px-2 py-0.5">
            {label}
          </span>
        </>
      }
      body={
        <>
          <p className="text-xs text-fg/70">
            {r.stringer_name} · {money(r.discounted_price)}
          </p>
          <p className="mt-3.5 font-mono text-2xl tracking-[0.14em] text-clay-fg">{r.code}</p>
          <p className="text-xs text-fg/70 mt-1.5">Show this code when you go in</p>
          {r.status === 'flagged' && r.flag_note && (
            <p className="text-xs text-badge/90 mt-2">Flagged: {r.flag_note}</p>
          )}
        </>
      }
      footerMeta={
        <>
          <div className="flex gap-2">
            <Button size="sm" variant="white" className="flex-1" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? 'Copied' : 'Copy code'}
            </Button>
            {r.status === 'active' && (
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onCancel(r.code)} isLoading={busy}>
                Cancel
              </Button>
            )}
          </div>
          {r.status === 'cancel_requested' && (
            <p className="text-xs text-fg/70 mt-2">Waiting on the administrator to review your cancellation.</p>
          )}
        </>
      }
    />
  );
};

// ─── Provider's own coupon list (stringer or coach) ─────────────────────────────────────────

const ProviderPanel: React.FC = () => {
  const { providerId, redemptions, loading } = useProviderRedemptions();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!providerId) return null;

  const open = redemptions.filter((r) => r.status === 'active' || r.status === 'cancel_requested');
  const recent = redemptions.filter((r) => r.status === 'used').slice(0, 5);

  const run = async (code: string, fn: () => Promise<unknown>) => {
    setBusy(code);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(serviceErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="h-14 bg-fg/5 rounded-2xl animate-pulse mb-5" />;
  }

  const rows = (
    <>
      {error && <FieldError>{error}</FieldError>}
      {open.length === 0 ? (
        <p className="text-sm text-fg/70">No open coupons right now.</p>
      ) : (
        <div className="space-y-2">
          {open.map((r) => (
            <div key={r.code} className="rounded-2xl bg-tennis-surface/40 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{r.user_name}</p>
                  <p className="font-mono text-xs text-fg/70 tracking-wider mt-0.5">
                    {r.code} · {r.offer}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <motion.button
                    type="button"
                    onClick={() => run(r.code, () => markCouponUsed({ code: r.code }))}
                    disabled={busy === r.code}
                    whileTap={tapScale.whileTap}
                    transition={tapScale.transition}
                    className="p-2.5 rounded-xl bg-green-500/15 text-badge-win hover:bg-green-500/25 transition-colors disabled:opacity-50"
                    aria-label={`Mark ${r.code} used`}
                  >
                    <Check className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => run(r.code, () => flagCoupon({ code: r.code }))}
                    disabled={busy === r.code}
                    whileTap={tapScale.whileTap}
                    transition={tapScale.transition}
                    className="px-3 py-2.5 rounded-xl bg-amber-500/15 text-badge hover:bg-amber-500/25 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Dispute
                  </motion.button>
                </div>
              </div>
              {r.status === 'cancel_requested' && (
                <p className="text-xs text-fg/70 mt-1.5">Player asked to cancel. An administrator is reviewing it.</p>
              )}
            </div>
          ))}
        </div>
      )}
      {recent.length > 0 && (
        <p className="text-xs text-fg/70 mt-3">Recently used: {recent.map((r) => r.code).join(', ')}</p>
      )}
    </>
  );

  if (open.length === 0) {
    return <div className="mb-5">{rows}</div>;
  }

  return (
    <ReviewPanel title="Your shop" count={open.length} defaultOpen className="mb-5">
      {rows}
    </ReviewPanel>
  );
};

// ─── The tab ────────────────────────────────────────────────────────────────────────────────

export const ServicesTab: React.FC = () => {
  const { user } = useAuth();
  const { rewards, byCategory, loading: catalogLoading, reload: reloadCatalog } = useServicesCatalog();
  const { providerId } = useProviderRole();
  const [showAddService, setShowAddService] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const canManageOffers = user?.uid === SUPER_ADMIN_UID || !!providerId;
  const providerAvatars = useProviderAvatars(rewards.map((r) => r.uid));
  const { balance, loading: balanceLoading } = useRedeemablePoints();
  const { redemptions } = useMyRedemptions();
  const { bookings } = useMyBookings();
  const bookingTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    for (const reward of rewards) titles[reward.id] = reward.offer;
    return titles;
  }, [rewards]);
  // Multiple categories/providers can be open at once here — unlike the Tree elsewhere in the
  // app (Tournament draws, Leaderboard divisions), which stays single-open. This page only.
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['stringing']));
  const [openProviders, setOpenProviders] = useState<Set<string>>(new Set());
  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) =>
    setter((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { ask: askConfirmation, sheet: confirmationSheet } = useConfirmSheet();

  const openCoupons = redemptions.filter(
    (r) => r.status === 'active' || r.status === 'flagged' || r.status === 'cancel_requested',
  );
  const openRewardIds = new Set(openCoupons.map((r) => r.reward_id));

  const pct = Math.min(100, (Math.max(0, balance) / MIN_REWARD_COST) * 100);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(serviceErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const removeOffer = async (reward: Reward) => {
    askConfirmation({
      title: 'Remove this offer?',
      message: `Remove “${reward.offer}”? It will no longer be shown, but existing coupons will still work.`,
      confirmLabel: 'Remove offer',
      onConfirm: async () => {
        setDeletingId(reward.id);
        setError('');
        try {
          await deactivateOffer(reward.id);
          reloadCatalog();
        } catch {
          setError('Could not remove that offer. Try again.');
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const categories: ServiceCategory[] = ['stringing', 'coaching', 'others'];

  return (
    <div>
      {/* Balance. Earned/spent totals deliberately omitted — what matters here is what you can
          spend right now, and the Tasks page already tracks earning. */}
      <motion.div {...fadeUp} className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-3xl font-black text-clay-fg leading-none">{balanceLoading ? '—' : balance}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-fg/70 mt-1.5">Redeemable points</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-fg">Use points to get discounts</p>
        </div>
      </motion.div>

      <div className="h-1.5 rounded-full bg-fg/10 overflow-hidden mb-5">
        <div className="h-full rounded-full bg-clay transition-all duration-motion" style={{ width: `${pct}%` }} />
      </div>

      {!user && (
        <p className="text-xs text-fg/70 mb-5 -mt-3">
          <Link to="/login" className="text-clay-fg font-bold hover:underline">
            Join or log in
          </Link>{' '}
          to redeem points or book a service.
        </p>
      )}

      {error && (
        <AlertMessage tone="error" className="mb-4">
          {error}
        </AlertMessage>
      )}

      <ProviderPanel />

      {openCoupons.length > 0 && (
        <div className="space-y-2.5 mb-5">
          {openCoupons.map((r) => (
            <CouponCard
              key={r.code}
              r={r}
              onCancel={(code) => run(code, () => requestCancellation({ code }))}
              busy={busyId === r.code}
            />
          ))}
        </div>
      )}

      <BookingsList items={bookings} titles={bookingTitles} />

      {catalogLoading ? (
        <div className="h-40 bg-tennis-surface/30 rounded-3xl animate-pulse" />
      ) : byCategory.size === 0 ? (
        <EmptyState title="No services available yet" description="Check back soon." />
      ) : (
        <Tree>
          {categories.map((cat) => {
            const providers: Provider[] = byCategory.get(cat) ?? [];
            if (providers.length === 0) return null;
            const offerCount = providers.reduce((n, p) => n + p.offers.length, 0);
            return (
              <TreeGroup
                key={cat}
                id={cat}
                label={CATEGORY_LABEL[cat]}
                right={`${offerCount} offer${offerCount === 1 ? '' : 's'}`}
                open={openCategories.has(cat)}
                onToggle={toggleSet(setOpenCategories)}
              >
                {providers.map((p) => (
                  <TreeGroup
                    key={p.id}
                    id={`${cat}:${p.id}`}
                    level={1}
                    open={openProviders.has(`${cat}:${p.id}`)}
                    onToggle={toggleSet(setOpenProviders)}
                    label={
                      <span className="flex items-center gap-2">
                        <ProviderAvatar name={p.name} src={p.uid ? providerAvatars[p.uid] : undefined} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            {p.name}
                            {p.certified && (
                              <Pill tone="accent">
                                <BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Certified
                              </Pill>
                            )}
                          </span>
                          <span className="block text-xs font-medium text-fg/70 mt-0.5">{p.area}</span>
                        </span>
                      </span>
                    }
                    // Signed-out visitors can browse the catalogue but don't get providers'
                    // phone numbers and emails handed to them.
                    right={
                      user ? (
                        <ContactOpponentButton
                          name={p.name}
                          phone={p.phone}
                          email={p.email}
                          size="sm"
                          variant="white"
                        />
                      ) : undefined
                    }
                    bodyClassName="px-5 space-y-2.5"
                  >
                    {p.offers.map((r) => (
                      <OfferCard
                        key={r.id}
                        reward={r}
                        balance={balance}
                        alreadyOpen={openRewardIds.has(r.id)}
                        busy={busyId === r.id}
                        onBook={() => run(r.id, () => bookService({ service_id: r.id, provider_id: r.provider_id }))}
                        onRedeem={() => run(r.id, () => redeemReward({ rewardId: r.id }))}
                        onEdit={canManageOffers ? () => setEditingReward(r) : undefined}
                        onDelete={canManageOffers && deletingId !== r.id ? () => removeOffer(r) : undefined}
                      />
                    ))}
                  </TreeGroup>
                ))}
              </TreeGroup>
            );
          })}
        </Tree>
      )}

      {canManageOffers && (
        <Fab ariaLabel="Add a service" onClick={() => setShowAddService(true)}>
          <Plus className="w-6 h-6" />
        </Fab>
      )}

      {(showAddService || editingReward) && (
        <AddServiceForm
          byCategory={byCategory}
          editingReward={editingReward ?? undefined}
          onClose={() => {
            setShowAddService(false);
            setEditingReward(null);
          }}
          onCreated={reloadCatalog}
        />
      )}
      {confirmationSheet}
    </div>
  );
};
