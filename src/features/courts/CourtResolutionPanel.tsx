import React, { useState } from 'react';
import { AlertMessage } from '../../components/AlertMessage';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ListGroup } from '../../components/ListGroup';
import { ListRow } from '../../components/ListRow';
import { SelectSheet } from '../../components/SelectSheet';
import { ZONE_NAMES } from '../../utils/zones';
import {
  courtResolutionErrorMessage,
  resolveCourtZone,
  useCourtResolutionAudit,
  useCourtResolutions,
} from './courtResolutionService';
import { isCourtZoneName } from './resolution';

const zoneOptions = ZONE_NAMES.map((zone) => ({ value: zone, label: zone }));

/** Super-admin: add a court, assign its zone, and read the audit trail. */
export const CourtResolutionPanel: React.FC = () => {
  const { resolutions } = useCourtResolutions();
  const { audit } = useCourtResolutionAudit();
  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !isCourtZoneName(zone)) {
      setError('Court name and zone are required.');
      return;
    }
    setBusy(true);
    setError('');
    setSaved('');
    try {
      const result = await resolveCourtZone({ name: trimmed, zone });
      setSaved(`${trimmed} · ${result.zone}`);
      setName('');
    } catch (err) {
      setError(courtResolutionErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-3 space-y-3">
      {error ? <AlertMessage tone="error">{error}</AlertMessage> : null}
      {saved ? <AlertMessage tone="success">{saved}</AlertMessage> : null}

      <section className="rounded-3xl border border-fg/15 p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-fg/70">Court resolution</h2>
        <p className="mt-1 text-xs text-fg/70">Add a court and its zone without editing shipped court data.</p>
        <form className="mt-3 space-y-3" onSubmit={submit}>
          <Input
            label="Court name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
          />
          <SelectSheet label="Zone" value={zone} options={zoneOptions} onChange={setZone} required />
          <Button type="submit" variant="clay" size="sm" disabled={busy}>
            Save court
          </Button>
        </form>
      </section>

      <ListGroup title="Runtime courts" count={resolutions.length}>
        {resolutions.length === 0 ? (
          <ListRow title="None yet" description="Saved courts appear here." />
        ) : (
          resolutions.map((row) => <ListRow key={row.court_key} title={row.name} description={row.zone} />)
        )}
      </ListGroup>

      <ListGroup title="Audit" count={audit.length}>
        {audit.length === 0 ? (
          <ListRow title="No changes yet" />
        ) : (
          audit.map((row, index) => (
            <ListRow
              key={`${row.court_key}-${row.created_at}-${index}`}
              title={`${row.name} · ${row.after.zone}`}
              description={
                row.before
                  ? `${row.before.zone || 'none'} → ${row.after.zone} · ${row.actor_uid} · ${row.created_at}`
                  : `added · ${row.actor_uid} · ${row.created_at}`
              }
            />
          ))
        )}
      </ListGroup>
    </div>
  );
};
