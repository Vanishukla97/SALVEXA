'use client';

import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { formatDistance, type NearbyHospital } from '../../lib/emergency';

type HospitalCardProps = {
  hospital: NearbyHospital;
  accent?: 'preferred' | 'default';
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (hospital: NearbyHospital) => void;
  onSend?: (hospital: NearbyHospital) => void;
  isSending?: boolean;
  disabled?: boolean;
};

export function HospitalCard({
  hospital,
  accent = 'default',
  selectable = false,
  selected = false,
  onToggleSelect,
  onSend,
  isSending = false,
  disabled = false,
}: HospitalCardProps) {
  const isPreferred = accent === 'preferred';

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        selected
          ? 'border-red-300 bg-red-50/80'
          : isPreferred
            ? 'border-emerald-200 bg-emerald-50/70'
            : 'border-outline-variant/25 bg-surface-container-lowest'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isPreferred ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          <Icon name={isPreferred ? 'verified_user' : 'local_hospital'} className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-bold text-on-surface">{hospital.name}</h4>
            {isPreferred ? (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Preferred
              </span>
            ) : null}
          </div>

          {hospital.speciality ? (
            <p className="mt-1 text-xs font-semibold text-primary">
              <Icon name="local_hospital" className="mr-1 inline h-3 w-3 align-text-bottom" />
              {hospital.speciality}
            </p>
          ) : null}

          <div className="mt-2 space-y-1 text-xs text-on-surface-variant">
            <p className="flex items-start gap-1.5">
              <Icon name="location_on" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{hospital.address || 'Address not available'}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Icon name="near_me" className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDistance(hospital.distance_km)}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Icon name="call" className="h-3.5 w-3.5 shrink-0" />
              {hospital.phone ? (
                <a href={`tel:${hospital.phone}`} className="font-semibold text-primary hover:underline">
                  {hospital.phone}
                </a>
              ) : (
                <span>Emergency number not listed</span>
              )}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectable ? (
              <Button
                type="button"
                size="sm"
                variant={selected ? 'secondary' : 'primary'}
                onClick={() => onToggleSelect?.(hospital)}
              >
                {selected ? 'Selected' : 'Select'}
              </Button>
            ) : null}

            {onSend ? (
              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={isSending || disabled}
                onClick={() => onSend(hospital)}
              >
                {isSending ? 'Sending...' : 'Send SOS Here'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
