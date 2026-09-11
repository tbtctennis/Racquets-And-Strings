import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ChevronRight, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeUp, staggerDelay, tapScale } from '../lib/motion';
import { AppNotification, timeAgo, useNotifications } from '../features/notifications/useNotifications';
import { rewardsAvailable, useRedeemablePoints } from '../features/services/useServices';
import { ListGroup } from '../components/ListGroup';
import { ListRow } from '../components/ListRow';
import { Skeleton } from '../components/Skeleton';

// Full-screen notifications feed (replaces the old bell dropdown). Opening the page marks
// everything read, matching the dropdown's old behavior; tapping an item deep-links to it.
// Beta delivery is this list: zone-change, decline, dispute, and result notices included.
// Email stays off unless the staging allowlist switch is on; push is backlog.
export const Notifications: React.FC = () => {
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const { balance: redeemable } = useRedeemablePoints();
  const claimableRewards = rewardsAvailable(redeemable);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Notifications · Racquets & Strings';
  }, []);

  useEffect(() => {
    if (!loading && unreadCount > 0) markAllRead();
  }, [loading, unreadCount, markAllRead]);

  const openItem = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.link) navigate(n.link);
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
        <Bell className="w-5 h-5 text-clay-fg" />
        <h1 className="sr-only">Notifications</h1>
      </div>

      {/* Pinned, not a stored notification. It's derived from the current balance, so it can't
          go stale, can't fire again on every point earned, and needs no Cloud Function writing
          a doc per member. Only shown once there's enough to actually spend. */}
      {claimableRewards > 0 && (
        <motion.div {...fadeUp} className="mb-3">
          <Link
            to="/marketplace"
            className="flex items-center gap-3 rounded-2xl bg-clay/[0.08] px-4 py-3 hover:bg-clay/[0.12] transition-colors"
          >
            <Gift className="w-5 h-5 text-clay-fg shrink-0" />
            <p className="min-w-0 flex-1 text-sm font-bold text-fg">
              You have collected {redeemable} Points. {claimableRewards} Reward{claimableRewards === 1 ? '' : 's'}{' '}
              available.
            </p>
            <ChevronRight className="w-4 h-4 text-clay-fg shrink-0" />
          </Link>
        </motion.div>
      )}

      {loading ? (
        <ListGroup title="Notifications" className="rounded-3xl" labelledBy="notifications-list">
          <div role="status" aria-label="Loading notifications">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} as="ListRow" aria-hidden />
            ))}
          </div>
        </ListGroup>
      ) : items.length === 0 && claimableRewards === 0 ? (
        <div className="rounded-3xl bg-tennis-surface/30 py-16 text-center">
          <Bell className="w-8 h-8 text-fg/70 mx-auto mb-3" />
          <p className="text-sm text-fg/70">Nothing yet. Match updates and task news land here.</p>
        </div>
      ) : (
        <ListGroup title="Notifications" className="rounded-3xl" labelledBy="notifications-list">
          {items.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...fadeUp.transition, delay: staggerDelay(i) }}
              whileTap={tapScale.whileTap}
            >
              <ListRow
                onClick={() => openItem(n)}
                leading={n.read ? undefined : <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />}
                title={n.title}
                description={n.body}
                meta={timeAgo(n.created_at)}
                className={n.read ? undefined : 'bg-clay/[0.07]'}
              />
            </motion.div>
          ))}
        </ListGroup>
      )}
    </div>
  );
};
