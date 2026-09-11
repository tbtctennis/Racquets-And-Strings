import React, { useState } from 'react';
import { AlertMessage } from '../../components/AlertMessage';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Sheet } from '../../components/Sheet';
import { createCheckoutSession } from './checkoutSession';
import {
  CAMPAIGN_COPY,
  DEFAULT_DONATION_AMOUNT,
  currentSeasonName,
  parseDonationAmount,
  startDonationCheckout,
} from './donateCheckout';

type DonationSurfaceProps = {
  onClose: () => void;
  now?: Date | string;
  origin?: string;
  createSession?: typeof createCheckoutSession;
  assign?: (url: string) => void;
};

export const DonationSurface: React.FC<DonationSurfaceProps> = ({
  onClose,
  now,
  origin,
  createSession = createCheckoutSession,
  assign = (url) => window.location.assign(url),
}) => {
  const [amount, setAmount] = useState(String(DEFAULT_DONATION_AMOUNT));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const season = currentSeasonName(now);

  const donate = async () => {
    const parsed = parseDonationAmount(amount);
    if (parsed == null) {
      setError('Minimum donation is $0.50.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await startDonationCheckout({
        amount: parsed,
        origin: origin ?? window.location.origin,
        createSession,
        assign,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message && !message.startsWith('INTERNAL') ? message : 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <Sheet onClose={onClose} title="Support the league" maxWidthClassName="max-w-md">
      <p className="text-sm leading-relaxed text-fg/75">
        Donations go {CAMPAIGN_COPY}. This is the {season} campaign.
      </p>
      <Input
        label="Amount"
        type="number"
        inputMode="decimal"
        min="0.50"
        step="0.50"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        startAdornment={<span className="text-sm font-bold text-fg/70">$</span>}
        hint="Canadian dollars. Hosted Stripe Checkout in test mode."
      />
      {error ? <AlertMessage tone="error">{error}</AlertMessage> : null}
      <Button type="button" className="w-full" isLoading={loading} onClick={donate}>
        Continue to checkout
      </Button>
    </Sheet>
  );
};
