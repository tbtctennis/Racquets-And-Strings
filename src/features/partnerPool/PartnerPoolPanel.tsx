import React, { useEffect, useState } from 'react';
import { ContactOpponentButton } from '../../components/ContactOpponentButton';
import { useExpandedRow } from '../../lib/expandedRow';
import { leavePool, type PartnerPoolCategory } from '../events/services/partnerPool';
import { DoublesPoolCard } from './DoublesPoolCard';
import { emptyValues, useDoublesPoolCardData } from './useDoublesPoolCardData';
import { usePool, usePoolContacts } from './usePool';

export const PartnerPoolPanel: React.FC<{
  eventId: string;
  uid: string;
  category: PartnerPoolCategory;
}> = ({ eventId, uid, category }) => {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { members, loading } = usePool(eventId, category);
  const { contacts } = usePoolContacts(eventId);
  const isInPool = members.some((member) => member.uid === uid);
  const { expandedId, toggle } = useExpandedRow();
  const cardValues = useDoublesPoolCardData(open ? members.map((member) => member.uid) : []);

  useEffect(() => {
    if (isInPool) setOpen(true);
  }, [isInPool]);

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leavePool(eventId, uid);
      setOpen(false);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-clay/25 bg-clay/5 p-4" aria-label="Partner pool">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-fg">Partner pool</h2>
          <p className="mt-1 text-xs text-fg/70">Players looking for a doubles partner.</p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-clay/50 px-3 py-2 text-xs font-bold text-clay-fg"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Partner pool'}
        </button>
      </div>
      {open && (
        <div className="mt-3">
          {loading ? (
            <p className="py-4 text-sm text-fg/70">Loading players…</p>
          ) : members.length === 0 ? (
            <p className="py-4 text-sm text-fg/70">
              Nobody is waiting yet. Join the pool and other players looking for a partner will see you.
            </p>
          ) : (
            members.map((member) => {
              const contact = isInPool ? contacts[member.uid] : undefined;
              return (
                <DoublesPoolCard
                  key={member.uid}
                  id={member.uid}
                  name={member.name}
                  subtitle={`Skill ${member.skill.toFixed(1)}`}
                  isYou={member.uid === uid}
                  values={cardValues[member.uid] ?? emptyValues()}
                  open={expandedId === member.uid}
                  onToggle={() => toggle(member.uid)}
                  action={
                    contact ? (
                      <ContactOpponentButton
                        name={member.name}
                        email={contact.email}
                        phone={contact.phone}
                        whatsappContact={contact.whatsapp_contact}
                        preferred={contact.preferred_mode_of_contact}
                        size="sm"
                      />
                    ) : undefined
                  }
                />
              );
            })
          )}
          {isInPool && (
            <button
              type="button"
              disabled={leaving}
              onClick={() => void handleLeave()}
              className="mt-3 text-xs font-bold text-badge-loss disabled:opacity-50"
            >
              {leaving ? 'Leaving…' : 'Leave partner pool'}
            </button>
          )}
        </div>
      )}
    </section>
  );
};
