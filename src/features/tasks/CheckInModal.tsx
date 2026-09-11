import React, { useEffect, useState } from 'react';
import { CheckCircle2, Navigation } from 'lucide-react';
import { Sheet } from '../../components/Sheet';
import { Button } from '../../components/Button';
import { Spinner } from '../../components/Spinner';
import { FieldError } from '../../components/FieldError';
import { ListGroup } from '../../components/ListGroup';
import { ListRow } from '../../components/ListRow';
import { controlChrome } from '../../lib/controlChrome';
import { useAuth } from '../../context/AuthContext';
import {
  CHECKIN_RADIUS_M,
  NearbyCourt,
  TopCheckIn,
  VISIT_TYPES,
  VisitType,
  checkIn,
  findNearbyCourts,
  getCurrentPosition,
  getTopCheckIns,
  logAttendance,
} from './checkinService';

type Step = 'start' | 'locating' | 'pick' | 'success' | 'error';

// Court check-in. The start screen shows a Top check-ins list and a "Courts nearby" button;
// location is only requested when the player taps that button (never on load). Only the nearest
// court within CHECKIN_RADIUS_M can actually be checked into.
export const CheckInModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>('start');
  const [error, setError] = useState('');
  const [nearby, setNearby] = useState<NearbyCourt[]>([]);
  const [busyCourt, setBusyCourt] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [checkedInto, setCheckedInto] = useState<NearbyCourt | null>(null);
  const [visitType, setVisitType] = useState<VisitType>('Practice');
  const [topCheckIns, setTopCheckIns] = useState<TopCheckIn[]>([]);

  useEffect(() => {
    getTopCheckIns()
      .then(setTopCheckIns)
      .catch(() => {});
  }, []);

  const locate = async () => {
    setStep('locating');
    setError('');
    try {
      const pos = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      setCoords({ lat, lng });
      const courts = await findNearbyCourts(lat, lng);
      setNearby(courts);
      setStep('pick');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStep('error');
    }
  };

  const doCheckIn = async (court: NearbyCourt) => {
    if (!user || !coords || busyCourt) return;
    setBusyCourt(court.key);
    setError('');
    try {
      const name = profile?.user.name || '';
      const full = { ...coords, distM: court.distM };

      // Always log daily attendance — the repeatable signal (feeds Matchday + zone sweeps).
      await logAttendance(user.uid, name, court, full, visitType);

      {
        // Writing the `courts` check-in doc is all the client does. `courtVisit`, `courtsVisited`
        // and `zoneComplete` are all awarded by onCourtVisitAwardPoints, which this write triggers.
        // The client used to set them directly, but those fields carry spendable points, so the
        // rules allowlist (correctly) rejects owner writes to them — the calls were failing
        // silently behind a bare catch, which is what made the 30-point zone tier unreachable.
        await checkIn(user.uid, name, court, full, visitType);
      }
      setCheckedInto(court);
      setStep('success');
    } catch {
      setError('Could not check in right now. Please try again.');
    } finally {
      setBusyCourt(null);
    }
  };

  return (
    <Sheet onClose={onClose} title="Court Check-In" maxWidthClassName="max-w-md">
      <div className="p-6 pt-2 space-y-5">
        {step === 'start' && (
          <div className="space-y-5">
            {/* Activity type */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-fg/70 uppercase tracking-widest">What are you here for?</p>
              <div className="grid grid-cols-2 gap-2">
                {VISIT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVisitType(t)}
                    className={`px-3 py-2.5 rounded-2xl text-sm font-bold transition-colors ${controlChrome(visitType === t)}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Top check-ins */}
            <div className="space-y-2">
              {topCheckIns.length === 0 ? (
                <>
                  <p className="text-xs font-bold text-fg/70 uppercase tracking-widest">Top check-ins</p>
                  <p className="text-fg/70 text-sm">No check-ins yet. Be the first.</p>
                </>
              ) : (
                <ListGroup title="Top check-ins">
                  {topCheckIns.map((c, i) => (
                    <ListRow
                      key={c.court}
                      leading={<span className="w-4 text-sm font-black text-fg/70">{i + 1}</span>}
                      title={c.court}
                      trailing={`${c.count} check-ins`}
                    />
                  ))}
                </ListGroup>
              )}
            </div>

            <Button onClick={locate} className="w-full">
              <Navigation className="w-4 h-4 mr-2" />
              Courts nearby
            </Button>
          </div>
        )}

        {step === 'locating' && (
          <div className="text-center py-10">
            <Spinner size="md" className="mx-auto mb-3" aria-hidden />
            <p className="text-fg/70 text-sm">Finding your location…</p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-4 py-6">
            <FieldError>{error}</FieldError>
            <Button variant="outline" onClick={locate} className="w-full">
              Try again
            </Button>
          </div>
        )}

        {step === 'pick' && (
          <div className="space-y-2">
            {error && <FieldError>{error}</FieldError>}
            {nearby.length === 0 ? (
              <p className="text-fg/70 text-sm text-center py-8">No courts nearby.</p>
            ) : (
              <ListGroup>
                {nearby.slice(0, 6).map((c) => {
                  const here = c.distM <= CHECKIN_RADIUS_M;
                  return (
                    <ListRow
                      key={c.key}
                      title={c.dropdown}
                      description={`${Math.round(c.distM)} m away`}
                      trailing={
                        here ? (
                          <Button
                            size="sm"
                            onClick={() => doCheckIn(c)}
                            isLoading={busyCourt === c.key}
                            disabled={!!busyCourt}
                          >
                            Check in
                          </Button>
                        ) : (
                          'Get closer'
                        )
                      }
                    />
                  );
                })}
              </ListGroup>
            )}
          </div>
        )}

        {step === 'success' && checkedInto && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-badge-win" />
            </div>
            <h3 className="text-lg font-bold text-fg">Completed.</h3>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
};
