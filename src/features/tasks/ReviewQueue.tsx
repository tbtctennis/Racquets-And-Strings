import React, { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { reviewClaim, type TaskClaim } from './claimService';
import { usePendingRedemptionReviews } from '../services/useServices';
import { markCouponUsed, reviewRedemption, serviceErrorMessage } from '../services/servicesApi';
import { PAYMENT_CURRENCY, PAYMENT_TIME_ZONE, type Payment } from '../payments/paymentDocument';
import { listPendingPaymentCancellations, reviewPaymentCancellation } from '../payments/usePayments';
import { AlertMessage } from '../../components/AlertMessage';
import { ApprovePair } from '../../components/ApprovePair';
import { ListGroup } from '../../components/ListGroup';
import { ListRow } from '../../components/ListRow';
import { ReviewPanel } from '../../components/ReviewPanel';

function formatCancellationAmount(amount: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: PAYMENT_CURRENCY.toUpperCase() }).format(amount);
}

function formatCancellationDate(value?: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PAYMENT_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

const CLAIM_LABEL: Record<TaskClaim['type'], string> = {
  volunteer: 'Volunteered',
  ambassador: 'Invited a player',
  host: 'Hosted a meetup',
};

// Super-admin-only: volunteer/ambassador/host claims waiting for approval, reward coupons that
// need a decision, and donation cancellation requests. Payments reads are owner-scoped, so the
// cancellation queue is loaded through a callable rather than a client query.
export const ReviewQueue: React.FC<{ defaultOpen?: 'claims' | null }> = ({ defaultOpen }) => {
  const [claims, setClaims] = useState<TaskClaim[]>([]);
  const [cancellations, setCancellations] = useState<Payment[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const coupons = usePendingRedemptionReviews(true);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'task_claims'), where('status', '==', 'pending')), (snap) =>
      setClaims(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskClaim)),
    );
    return () => unsub();
  }, []);

  const loadCancellations = useCallback(async () => {
    try {
      setCancellations(await listPendingPaymentCancellations());
    } catch {
      setCancellations([]);
    }
  }, []);

  useEffect(() => {
    void loadCancellations();
  }, [loadCancellations]);

  if (claims.length === 0 && coupons.length === 0 && cancellations.length === 0) return null;

  const approveClaim = async (id: string) => {
    setBusy(id);
    try {
      await reviewClaim(id, true);
    } finally {
      setBusy(null);
    }
  };
  const rejectClaim = async (id: string) => {
    setBusy(id);
    try {
      await reviewClaim(id, false);
    } finally {
      setBusy(null);
    }
  };

  const runCoupon = async (code: string, fn: () => Promise<unknown>) => {
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

  const runCancellation = async (paymentId: string, approve: boolean) => {
    setBusy(paymentId);
    setError('');
    try {
      await reviewPaymentCancellation(paymentId, approve);
      await loadCancellations();
    } catch (err) {
      setError(serviceErrorMessage(err));
      await loadCancellations();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mb-3 space-y-3">
      {error ? <AlertMessage tone="error">{error}</AlertMessage> : null}

      <ReviewPanel title="Task approvals" count={claims.length} defaultOpen={defaultOpen === 'claims'}>
        <ListGroup className="-mx-4 -mb-3 rounded-none border-0 bg-transparent">
          {claims.map((c) => (
            <ListRow
              key={c.id}
              title={`${c.user_name} · ${CLAIM_LABEL[c.type]}`}
              description={
                [
                  c.type === 'volunteer' && c.event_title,
                  c.type === 'ambassador' && c.invitee_name,
                  c.type === 'host' && [c.meetup_title, c.meetup_date].filter(Boolean).join(' · '),
                  c.note,
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
              trailing={
                <ApprovePair
                  busy={busy === c.id}
                  onApprove={() => approveClaim(c.id)}
                  onReject={() => rejectClaim(c.id)}
                />
              }
            />
          ))}
        </ListGroup>
      </ReviewPanel>

      {/* Reward coupons. A cancel request approves into a refund; a flag is resolved by either
          burning the coupon (it was used) or declining, which puts it back to active. */}
      <ReviewPanel title="Coupon decisions" count={coupons.length}>
        <ListGroup className="-mx-4 -mb-3 rounded-none border-0 bg-transparent">
          {coupons.map((r) => {
            const cancelling = r.status === 'cancel_requested';
            return (
              <ListRow
                key={r.code}
                title={
                  <>
                    <span className="font-mono tracking-wider">{r.code}</span> ·{' '}
                    {cancelling ? 'cancel requested' : 'flagged'}
                  </>
                }
                description={[
                  `${r.user_name} · ${r.offer} · ${r.stringer_name}`,
                  r.cancel_reason || r.flag_note,
                  cancelling
                    ? `Approving refunds ${r.points_cost} points. Declining leaves the coupon active.`
                    : 'Approving marks it used. Declining puts it back to active.',
                ]
                  .filter(Boolean)
                  .join(' · ')}
                trailing={
                  <ApprovePair
                    busy={busy === r.code}
                    approveLabel={cancelling ? 'Approve cancellation and refund' : 'Mark coupon used'}
                    rejectLabel="Decline, leave the coupon active"
                    onApprove={() =>
                      runCoupon(r.code, () =>
                        cancelling
                          ? reviewRedemption({ code: r.code, approve: true })
                          : markCouponUsed({ code: r.code }),
                      )
                    }
                    onReject={() => runCoupon(r.code, () => reviewRedemption({ code: r.code, approve: false }))}
                  />
                }
              />
            );
          })}
        </ListGroup>
      </ReviewPanel>

      <ReviewPanel title="Cancellation requests" count={cancellations.length}>
        <ListGroup className="-mx-4 -mb-3 rounded-none border-0 bg-transparent">
          {cancellations.map((payment) => (
            <ListRow
              key={payment.id}
              title={`${payment.user_name} · ${formatCancellationAmount(payment.amount)}`}
              description={[
                `${payment.season} · ${payment.type}`,
                formatCancellationDate(payment.cancellation_requested_at),
                'Approving refunds the donation. Declining leaves the payment intact.',
              ]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                <ApprovePair
                  busy={busy === payment.id}
                  approveLabel="Approve and refund"
                  rejectLabel="Decline, leave the payment intact"
                  onApprove={() => runCancellation(payment.id, true)}
                  onReject={() => runCancellation(payment.id, false)}
                />
              }
            />
          ))}
        </ListGroup>
      </ReviewPanel>
    </div>
  );
};
