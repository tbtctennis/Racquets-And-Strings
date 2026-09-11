import { hasAnalyticsConsent, waitForAnalyticsConsent } from './analyticsConsent';

async function readyAnalytics() {
  if (!hasAnalyticsConsent()) return null;
  const [{ logEvent, setUserId, setUserProperties }, { analyticsPromise }] = await Promise.all([
    import('firebase/analytics'),
    import('./firebase'),
  ]);
  const analytics = await analyticsPromise;
  if (!analytics) return null;
  return { analytics, logEvent, setUserId, setUserProperties };
}

/** Fire a GA4 event once analytics is ready (no-op without consent or if unsupported). */
export const track = (name: string, params?: Record<string, any>) =>
  readyAnalytics().then((api) => {
    if (api) api.logEvent(api.analytics, name, params);
  });

/**
 * Set GA4 User-ID after authentication and, optionally, non-PII user
 * properties. Uses the User-ID API only — never register the UID as a property.
 * Waits for consent so a login before the banner still applies after Accept.
 */
export const setAnalyticsUser = (uid: string, props?: Record<string, any>) =>
  waitForAnalyticsConsent().then((granted) => {
    if (!granted) return;
    return readyAnalytics().then((api) => {
      if (!api) return;
      api.setUserId(api.analytics, uid);
      if (props) api.setUserProperties(api.analytics, props);
    });
  });

/** Clear GA4 User-ID at logout. */
export const clearAnalyticsUser = () =>
  waitForAnalyticsConsent().then((granted) => {
    if (!granted) return;
    return readyAnalytics().then((api) => {
      if (api) api.setUserId(api.analytics, null);
    });
  });
