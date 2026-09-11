import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { PAYMENTS_COLLECTION, buildPaymentRecord, type Payment, type PaymentInput } from './paymentDocument';

// Own-uid query only — rules deny reading another member's payments and every client write.
// Request cancellation goes through requestPaymentCancellation; the browser never writes.

export function usePayments() {
  const { user } = useAuth();
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const paymentsQuery = query(collection(db, PAYMENTS_COLLECTION), where('uid', '==', user.uid));
    return onSnapshot(
      paymentsQuery,
      (snap) => {
        const rows = snap.docs
          .map((docSnap) => {
            try {
              return buildPaymentRecord({ ...(docSnap.data() as PaymentInput), id: docSnap.id });
            } catch {
              return null;
            }
          })
          .filter((row): row is Payment => row !== null)
          .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
        setItems(rows);
        setLoading(false);
      },
      () => {
        setItems([]);
        setLoading(false);
      },
    );
  }, [user]);

  return { items, loading };
}

export async function requestPaymentCancellation(paymentId: string): Promise<void> {
  const callable = httpsCallable<{ paymentId: string }, { ok: boolean }>(functions, 'requestPaymentCancellation');
  await callable({ paymentId });
}

// Organizer reads are denied by payments rules. The pending queue is this callable.
export async function listPendingPaymentCancellations(): Promise<Payment[]> {
  const callable = httpsCallable<Record<string, never>, { items: Payment[] }>(
    functions,
    'listPendingPaymentCancellations',
  );
  const result = await callable({});
  return (result.data.items || [])
    .map((row) => {
      try {
        return buildPaymentRecord({ ...(row as PaymentInput), id: row.id });
      } catch {
        return null;
      }
    })
    .filter((row): row is Payment => row !== null);
}

export async function reviewPaymentCancellation(paymentId: string, approve: boolean): Promise<void> {
  const callable = httpsCallable<{ paymentId: string; approve: boolean }, { ok: boolean }>(
    functions,
    'reviewPaymentCancellation',
  );
  await callable({ paymentId, approve });
}
