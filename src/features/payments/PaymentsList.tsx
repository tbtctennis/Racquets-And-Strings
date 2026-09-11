import React from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ListGroup } from '../../components/ListGroup';
import { ListRow } from '../../components/ListRow';
import { Pill } from '../../components/Pill';
import { PAYMENT_CURRENCY, PAYMENT_TIME_ZONE, canOfferCancellation, type Payment } from './paymentDocument';
import { describePaymentRefund } from './refundMeaning';

function formatPaymentAmount(amount: number, currency: string = PAYMENT_CURRENCY): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: currency.toUpperCase() }).format(amount);
}

function formatPaymentDate(paidAt: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PAYMENT_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(paidAt));
}

type PaymentsListProps = {
  items: Payment[];
  now?: Date | string;
  requestingId?: string | null;
  onRequestCancellation?: (paymentId: string) => void;
};

function memberVisibleState(payment: Payment): string {
  // Stored cancellation_status is `requested`; the member sees that request as pending, not a refund.
  return payment.cancellation_status === 'requested' ? 'pending' : payment.state;
}

export const PaymentsList: React.FC<PaymentsListProps> = ({ items, now, requestingId, onRequestCancellation }) => {
  if (items.length === 0) {
    return <EmptyState title="No payments yet" description="Donations you make will show up here." />;
  }

  return (
    <ListGroup title="Payments" className="rounded-3xl" labelledBy="payments-list">
      {items.map((payment) => {
        const offerCancellation = canOfferCancellation(payment, now);
        const pending = payment.cancellation_status === 'requested';
        return (
          <div key={payment.id}>
            <ListRow
              title={formatPaymentAmount(payment.amount, payment.currency)}
              meta={formatPaymentDate(payment.paid_at)}
              description={`${payment.season} · ${payment.type} · ${pending ? memberVisibleState(payment) : describePaymentRefund(payment)}`}
              trailing={
                pending ? (
                  <span className="inline-flex items-center justify-end gap-1">
                    <Pill tone="warning">pending</Pill>
                    <Pill>{payment.type}</Pill>
                  </span>
                ) : (
                  <Pill>{payment.type}</Pill>
                )
              }
            />
            {offerCancellation ? (
              <div className="px-4 pb-3">
                <Button
                  type="button"
                  variant="outline"
                  isLoading={requestingId === payment.id}
                  onClick={() => onRequestCancellation?.(payment.id)}
                  aria-label={`Request cancellation of ${formatPaymentAmount(payment.amount, payment.currency)} ${payment.type}`}
                >
                  Request cancellation
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </ListGroup>
  );
};
