import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { AlertMessage } from '../components/AlertMessage';
import { ListGroup } from '../components/ListGroup';
import { Skeleton } from '../components/Skeleton';
import { PaymentsList } from '../features/payments/PaymentsList';
import { requestPaymentCancellation, usePayments } from '../features/payments/usePayments';

export const Payments: React.FC = () => {
  const { items, loading } = usePayments();
  const navigate = useNavigate();
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Payments · Racquets & Strings';
  }, []);

  const requestCancellation = async (paymentId: string) => {
    setRequestingId(paymentId);
    setError(null);
    try {
      await requestPaymentCancellation(paymentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message && !message.startsWith('INTERNAL') ? message : 'Something went wrong. Try again.');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4 md:pt-6">
      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-fg/70 hover:text-fg hover:bg-fg/5 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <CreditCard className="w-5 h-5 text-clay-fg" />
        <h1 className="sr-only">Payments</h1>
      </div>

      {error ? (
        <AlertMessage tone="error" className="mb-3">
          {error}
        </AlertMessage>
      ) : null}

      {loading ? (
        <ListGroup title="Payments" className="rounded-3xl" labelledBy="payments-list">
          <div role="status" aria-label="Loading payments">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} as="ListRow" aria-hidden />
            ))}
          </div>
        </ListGroup>
      ) : (
        <PaymentsList items={items} requestingId={requestingId} onRequestCancellation={requestCancellation} />
      )}
    </div>
  );
};
