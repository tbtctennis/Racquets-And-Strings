import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { track } from './lib/analytics';
import { subscribeAnalyticsConsent } from './lib/analyticsConsent';
import { Layout } from './components/Layout';
import { Spinner } from './components/Spinner';
import { lazyWithRetry } from './lib/lazyWithRetry';
import { getLoginPath } from './features/auth/authRedirect';

// Route-level code splitting: each page loads as its own chunk on demand,
// so the initial bundle stays small (faster first paint, esp. in-app browsers).
const Home = lazyWithRetry(() => import('./pages/Home').then((m) => ({ default: m.Home })), 'Home');
const Signup = lazyWithRetry(() => import('./pages/Signup').then((m) => ({ default: m.Signup })), 'Signup');
const Events = lazyWithRetry(() => import('./pages/Events').then((m) => ({ default: m.Events })), 'Events');
const Profile = lazyWithRetry(() => import('./pages/Profile').then((m) => ({ default: m.Profile })), 'Profile');
const PlayerProfile = lazyWithRetry(
  () => import('./pages/PlayerProfile').then((m) => ({ default: m.PlayerProfile })),
  'PlayerProfile',
);
const Leagues = lazyWithRetry(() => import('./pages/Leagues').then((m) => ({ default: m.Leagues })), 'Leagues');
const Tasks = lazyWithRetry(() => import('./pages/Tasks').then((m) => ({ default: m.Tasks })), 'Tasks');
const CourtMap = lazyWithRetry(() => import('./pages/CourtMap').then((m) => ({ default: m.CourtMap })), 'CourtMap');
const History = lazyWithRetry(() => import('./pages/History').then((m) => ({ default: m.History })), 'History');
const Matches = lazyWithRetry(() => import('./pages/Matches').then((m) => ({ default: m.Matches })), 'Matches');
const Notifications = lazyWithRetry(
  () => import('./pages/Notifications').then((m) => ({ default: m.Notifications })),
  'Notifications',
);
const Payments = lazyWithRetry(() => import('./pages/Payments').then((m) => ({ default: m.Payments })), 'Payments');
const Marketplace = lazyWithRetry(
  () => import('./pages/Marketplace').then((m) => ({ default: m.Marketplace })),
  'Marketplace',
);
const About = lazyWithRetry(() => import('./pages/StaticPages').then((m) => ({ default: m.About })), 'About');
const HowItWorks = lazyWithRetry(
  () => import('./pages/StaticPages').then((m) => ({ default: m.HowItWorks })),
  'HowItWorks',
);
const Terms = lazyWithRetry(() => import('./pages/StaticPages').then((m) => ({ default: m.Terms })), 'Terms');
const Privacy = lazyWithRetry(() => import('./pages/StaticPages').then((m) => ({ default: m.Privacy })), 'Privacy');
const Contact = lazyWithRetry(() => import('./pages/StaticPages').then((m) => ({ default: m.Contact })), 'Contact');
const ScrollToTop: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    const { history } = window;
    const previousScrollRestoration = history.scrollRestoration;

    history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    return () => {
      history.scrollRestoration = previousScrollRestoration;
    };
  }, [location.pathname]);

  React.useEffect(() => {
    const sendPageView = () => {
      void track('page_view', {
        page_path: location.pathname,
        page_search: location.search,
        page_location: window.location.href,
      });
    };
    sendPageView();
    return subscribeAnalyticsConsent(sendPageView);
  }, [location.pathname, location.search]);

  return null;
};

// The Tournament tab merged into Matches (?mode=tournament) — old /tournament?event=X links
// (History, bookmarks) still need to land on the right event, so forward the `event` param too.
const TournamentRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const to = eventId ? `/matches?mode=tournament&event=${eventId}` : '/matches?mode=tournament';
  return <Navigate to={to} replace />;
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Spinner />
      </div>
    );
  }

  if (user) return <>{children}</>;

  const destination = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={getLoginPath(destination)} replace />;
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            {/* Suspense now lives inside Layout, outside the route-keyed <main> — see the comment
              there. Keeping it here meant it remounted on every navigation. */}
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Signup />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/events" element={<Events />} />
                <Route path="/tournament" element={<TournamentRedirect />} />
                <Route path="/leagues" element={<Leagues />} />
                <Route
                  path="/tasks"
                  element={
                    <PrivateRoute>
                      <Tasks />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <PrivateRoute>
                      <History />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/matches"
                  element={
                    <PrivateRoute>
                      <Matches />
                    </PrivateRoute>
                  }
                />
                <Route path="/rallies" element={<Navigate to="/matches?mode=rallies" replace />} />
                <Route path="/challenges" element={<Navigate to="/matches?mode=challenges" replace />} />
                <Route
                  path="/notifications"
                  element={
                    <PrivateRoute>
                      <Notifications />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <PrivateRoute>
                      <Payments />
                    </PrivateRoute>
                  }
                />
                {/* Open to logged-out visitors so the offers are browsable before signing up —
                    their offers balance reads 0, so nothing can actually be redeemed. */}
                <Route path="/marketplace" element={<Marketplace />} />
                <Route
                  path="/players/:userId"
                  element={
                    <PrivateRoute>
                      <PlayerProfile />
                    </PrivateRoute>
                  }
                />
                <Route path="/courts" element={<CourtMap />} />
                <Route path="/about" element={<About />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
