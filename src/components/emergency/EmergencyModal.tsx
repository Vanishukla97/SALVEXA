'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { HospitalCard } from './HospitalCard';
import { getAuthToken } from '../../lib/auth';
import {
  fetchEmergencyContext,
  fetchNearbyHospitals,
  dispatchEmergencyAlert,
  getCachedCoords,
  getUserLocation,
  type EmergencyContext,
  type EmergencyDispatchResult,
  type GeoCoords,
  type NearbyHospital,
} from '../../lib/emergency';

type EmergencyModalProps = {
  open: boolean;
  onClose: () => void;
  onToneStart?: () => void;
  onToneStop?: () => void;
};

export function EmergencyModal({ open, onClose, onToneStart, onToneStop }: EmergencyModalProps) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [context, setContext] = useState<EmergencyContext | null>(null);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<EmergencyDispatchResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [others, setOthers] = useState<NearbyHospital[]>([]);
  const [nearbyStatus, setNearbyStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [nearbyError, setNearbyError] = useState('');

  const loadNearby = useCallback(async (token: string, position: GeoCoords) => {
    setNearbyStatus('loading');
    setNearbyError('');
    try {
      const list = await fetchNearbyHospitals(token, position);
      setOthers(list.filter((hospital) => !hospital.is_preferred));
      setNearbyStatus('ready');
    } catch (nearbyErr) {
      setNearbyError(
        nearbyErr instanceof Error ? nearbyErr.message : 'Unable to load nearby hospitals.'
      );
      setNearbyStatus('error');
    }
  }, []);

  const load = useCallback(async () => {
    setPhase('loading');
    setError('');
    setDispatchResult(null);
    setShowPreview(false);
    setOthers([]);
    setNearbyStatus('idle');
    setNearbyError('');

    const token = getAuthToken();
    if (!token) {
      setError('Please log in to use emergency assistance.');
      setPhase('error');
      return;
    }

    const renderWith = async (position: GeoCoords | null) => {
      try {
        const ctx = await fetchEmergencyContext(token, position);
        setContext(ctx);
        setPhase('ready');
        if (position) {
          void loadNearby(token, position);
        }
      } catch (fetchErr) {
        setError(fetchErr instanceof Error ? fetchErr.message : 'Unable to load emergency data.');
        setPhase('error');
      }
    };

    // Render instantly from the last known location, if we have one.
    const cached = getCachedCoords();
    if (cached) {
      setCoords(cached);
      void renderWith(cached);
    }

    let detected: GeoCoords | null = null;
    try {
      detected = await getUserLocation();
      setCoords(detected);
      setLocationError('');
    } catch (locationErr) {
      if (!cached) setCoords(null);
      setLocationError(locationErr instanceof Error ? locationErr.message : 'Location unavailable.');
    }

    const movedEnough =
      Boolean(detected) &&
      (!cached ||
        Math.abs(cached!.lat - detected!.lat) > 0.002 ||
        Math.abs(cached!.lng - detected!.lng) > 0.002);

    if (!cached || movedEnough) {
      await renderWith(detected);
    }
  }, [loadNearby]);

  useEffect(() => {
    if (!open) return;
    onToneStart?.();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, load]);

  const handleClose = () => {
    onToneStop?.();
    onClose();
  };

  const handleSend = async (hospital: NearbyHospital) => {
    const token = getAuthToken();
    if (!token) {
      setError('Please log in to send an emergency alert.');
      return;
    }
    setSendingId(hospital.osm_id);
    setError('');
    try {
      const result = await dispatchEmergencyAlert(token, { hospital, coords });
      setDispatchResult(result);
    } catch (sendErr) {
      setError(sendErr instanceof Error ? sendErr.message : 'Unable to send the emergency alert.');
    } finally {
      setSendingId(null);
    }
  };

  if (!open) return null;

  const preferred = context?.preferredHospitals || [];

  return (
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 bg-red-950/65 backdrop-blur-lg" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,110,110,0.28),transparent_60%)]" />
      <div className="relative flex h-full w-full items-start justify-center overflow-y-auto px-3 py-6">
        <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-red-200/35 bg-[linear-gradient(165deg,rgba(127,29,29,0.97),rgba(69,10,10,0.98))] text-white shadow-[0_30px_90px_-20px_rgba(127,29,29,0.9)]">
          <div className="relative p-6 md:p-8">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12">
                  <span className="relative mr-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-200 opacity-70" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-100" />
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100/90">High Alert</p>
                  <h3 className="text-2xl font-black tracking-tight md:text-3xl">Emergency Assistance</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-red-200/45 p-2 text-red-100 transition-colors hover:bg-red-900/45"
                aria-label="Close emergency assistance"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            {phase === 'loading' ? (
              <div className="rounded-2xl border border-white/15 bg-white/8 p-6 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <p className="text-sm font-semibold">Getting your location and nearby hospitals...</p>
              </div>
            ) : null}

            {phase === 'error' ? (
              <div className="rounded-2xl border border-red-200/35 bg-red-900/40 p-5">
                <p className="text-sm font-semibold text-red-50">{error}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button type="button" size="sm" variant="secondary" onClick={() => void load()}>
                    Try again
                  </Button>
                  <a
                    href="tel:108"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-black text-red-800 hover:bg-red-50"
                  >
                    Call 108 Ambulance
                  </a>
                  <a
                    href="tel:112"
                    className="inline-flex items-center justify-center rounded-xl border border-red-200/35 bg-red-900/50 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-900/70"
                  >
                    Call 112 Emergency
                  </a>
                </div>
              </div>
            ) : null}

            {phase === 'ready' && dispatchResult ? (
              <div className="rounded-2xl border border-emerald-200/40 bg-emerald-900/30 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Icon name="check_circle" className="h-6 w-6 text-emerald-300" />
                  <h4 className="text-lg font-black">Emergency alert sent</h4>
                </div>
                <p className="text-sm text-red-50/95">
                  Your emergency details were sent to{' '}
                  <span className="font-bold">{dispatchResult.recipients.hospital.name || 'the hospital'}</span>
                  {dispatchResult.recipients.guardian.phone ? (
                    <>
                      {' '}
                      and your emergency contact{' '}
                      <span className="font-bold">{dispatchResult.recipients.guardian.phone}</span>
                    </>
                  ) : null}
                  .
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold">
                    Hospital SMS: {dispatchResult.recipients.hospital.status}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold">
                    Guardian SMS: {dispatchResult.recipients.guardian.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-red-100/80">
                  SMS delivery is running in mock mode for now (logged on the server), so no real message is
                  sent yet.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="tel:108"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-black text-red-800 hover:bg-red-50"
                  >
                    Call 108 Ambulance
                  </a>
                  <button
                    type="button"
                    onClick={() => setDispatchResult(null)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200/45 px-4 py-2.5 text-sm font-bold text-red-100 hover:bg-red-900/45"
                  >
                    Send another alert
                  </button>
                </div>
              </div>
            ) : null}

            {phase === 'ready' && !dispatchResult ? (
              <div className="space-y-4">
                {locationError ? (
                  <div className="rounded-xl border border-amber-200/40 bg-amber-900/30 px-4 py-3 text-xs font-semibold text-amber-50">
                    {locationError} Showing saved preferred hospitals only.
                  </div>
                ) : null}

                {!context?.setupComplete ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                    <p className="text-xs font-semibold text-red-50">
                      You have not finished emergency setup (blood group, guardian contact, preferred hospitals).
                    </p>
                    <Link
                      href="/onboarding"
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-black text-red-800 hover:bg-red-50"
                    >
                      Complete setup
                    </Link>
                  </div>
                ) : null}

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-red-100">
                    <Icon name="verified_user" className="h-4 w-4" />
                    Your preferred hospitals
                  </h4>
                  {preferred.length ? (
                    <div className="space-y-3">
                      {preferred.map((hospital) => (
                        <HospitalCard
                          key={hospital.osm_id}
                          hospital={hospital}
                          accent="preferred"
                          onSend={handleSend}
                          isSending={sendingId === hospital.osm_id}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-red-100/85">
                      No preferred hospitals saved yet. Add them in setup to see them here first.
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-red-100">
                      <Icon name="near_me" className="h-4 w-4" />
                      Other hospitals within {context?.radiusKm ?? 10} km
                    </h4>
                    {nearbyStatus === 'loading' ? (
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-red-100/85">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Searching...
                      </span>
                    ) : null}
                  </div>
                  {locationError ? (
                    <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-red-100/85">
                      Enable location access to list other hospitals nearby. You can still use your preferred
                      hospitals or call 108 / 112 below.
                    </p>
                  ) : nearbyStatus === 'loading' || nearbyStatus === 'idle' ? (
                    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-red-50">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Still searching for nearby hospitals...
                    </div>
                  ) : nearbyStatus === 'error' ? (
                    <div className="rounded-xl border border-amber-200/40 bg-amber-900/30 px-4 py-3 text-xs font-semibold text-amber-50">
                      <p>
                        {nearbyError ||
                          'Still searching for nearby hospitals... Try again if it takes too long.'}{' '}
                        You can still call 108 / 112 below.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="mt-3"
                        onClick={() => {
                          const token = getAuthToken();
                          if (token && coords) void loadNearby(token, coords);
                        }}
                      >
                        Retry nearby hospitals
                      </Button>
                    </div>
                  ) : others.length ? (
                    <div className="space-y-3">
                      {others.map((hospital) => (
                        <HospitalCard
                          key={hospital.osm_id}
                          hospital={hospital}
                          onSend={handleSend}
                          isSending={sendingId === hospital.osm_id}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-red-100/85">
                      No other hospitals found within range.
                    </p>
                  )}
                </div>

                {context?.messagePreview ? (
                  <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                    <button
                      type="button"
                      onClick={() => setShowPreview((prev) => !prev)}
                      className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wider text-red-100"
                    >
                      What will be sent
                      <Icon name={showPreview ? 'expand_more' : 'chevron_right'} className="h-4 w-4" />
                    </button>
                    {showPreview ? (
                      <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-black/25 p-3 text-[11px] leading-relaxed text-red-50/95">
                        {context.messagePreview}
                      </pre>
                    ) : null}
                  </div>
                ) : null}

                {error ? (
                  <p className="rounded-xl border border-red-300/50 bg-red-900/50 px-4 py-3 text-xs font-semibold text-red-50">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href="tel:108"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-red-800 hover:bg-red-50"
                  >
                    Call 108 Ambulance
                  </a>
                  <a
                    href="tel:112"
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200/35 bg-red-900/50 px-5 py-3 text-sm font-extrabold text-white hover:bg-red-900/70"
                  >
                    Call 112 Emergency
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
