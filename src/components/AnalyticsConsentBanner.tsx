import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { getAnalyticsConsent, setAnalyticsConsent, subscribeAnalyticsConsent } from '../lib/analyticsConsent';

export const AnalyticsConsentBanner: React.FC = () => {
  const [choice, setChoice] = useState(() => getAnalyticsConsent());

  useEffect(() => subscribeAnalyticsConsent(() => setChoice(getAnalyticsConsent())), []);

  if (choice) return null;

  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-fg/10 bg-tennis-dark/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <p className="text-sm text-fg">
          We use analytics to understand how the app is used. Accept or decline. Your choice is saved on this device.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" onClick={() => setAnalyticsConsent(false)}>
            Decline
          </Button>
          <Button type="button" variant="clay" onClick={() => setAnalyticsConsent(true)}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};
