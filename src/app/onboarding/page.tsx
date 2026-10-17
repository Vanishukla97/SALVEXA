'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';
import { HospitalCard } from '../../components/emergency/HospitalCard';
import { getAuthToken } from '../../lib/auth';
import { fetchApiJson } from '../../lib/api';
import {
  BLOOD_GROUPS,
  fetchNearbyHospitals,
  getUserLocation,
  type NearbyHospital,
} from '../../lib/emergency';

const chronicConditionOptions = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Other',
];

const MAX_PREFERRED_HOSPITALS = 3;

type ProfileApiPayload = {
  success?: boolean;
  message?: string;
  data?: {
    age?: number | null;
    weight?: number | null;
    height?: number | null;
    gender?: 'male' | 'female' | 'other' | null;
    blood_group?: string | null;
    past_surgeries?: string | null;
    guardian_name?: string | null;
    guardian_relation?: string | null;
    guardian_phone?: string | null;
    medical_history?: string | null;
    allergies?: unknown;
    current_medicines?: unknown;
    preferred_hospitals?: NearbyHospital[];
  } | null;
};

function parseList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      // noop
    }
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseChronicConditions(history?: string | null): string[] {
  const line = (history || '')
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith('chronic conditions:'));
  if (!line) return [];
  const value = line.slice('chronic conditions:'.length).trim();
  if (!value || value.toLowerCase() === 'none') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

const steps = ['Basic Details', 'Medical Info', 'Emergency Contact', 'Preferred Hospitals'];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [stepError, setStepError] = useState('');

  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  const [currentMedicines, setCurrentMedicines] = useState('');
  const [allergies, setAllergies] = useState('');
  const [allergyReaction, setAllergyReaction] = useState('');
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState('');
  const [pastSurgeries, setPastSurgeries] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const [selectedHospitals, setSelectedHospitals] = useState<NearbyHospital[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<NearbyHospital[]>([]);
  const [hospitalStatus, setHospitalStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [hospitalMessage, setHospitalMessage] = useState('');
  const hospitalPrefetch = useRef(false);

  const loadProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setIsLoading(true);
    try {
      const result = await fetchApiJson<ProfileApiPayload>('/profile', { token });
      const profile = result.payload.data;
      if (profile) {
        setAge(profile.age != null ? String(profile.age) : '');
        setGender(profile.gender || '');
        setWeight(profile.weight != null ? String(profile.weight) : '');
        setHeight(profile.height != null ? String(profile.height) : '');
        setBloodGroup(profile.blood_group || '');
        setCurrentMedicines(parseList(profile.current_medicines).join(', '));
        setAllergies(parseList(profile.allergies).join(', '));
        setPastSurgeries(profile.past_surgeries || '');
        setGuardianName(profile.guardian_name || '');
        setGuardianRelation(profile.guardian_relation || '');
        setGuardianPhone(profile.guardian_phone || '');

        const conditions = parseChronicConditions(profile.medical_history);
        const known = conditions.filter((item) => chronicConditionOptions.includes(item) && item !== 'Other');
        const unknown = conditions.filter((item) => !chronicConditionOptions.includes(item));
        setChronicConditions(known);
        setOtherCondition(unknown.join(', '));

        if (Array.isArray(profile.preferred_hospitals)) {
          setSelectedHospitals(profile.preferred_hospitals);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your profile');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const detectHospitals = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setHospitalStatus('loading');
    setHospitalMessage('');
    try {
      const coords = await getUserLocation();
      const hospitals = await fetchNearbyHospitals(token, coords);
      setNearbyHospitals(hospitals);
      setHospitalStatus('ready');
      setHospitalMessage(hospitals.length ? '' : 'No hospitals were found within 15 km of your location.');
    } catch (err) {
      setHospitalStatus('error');
      setHospitalMessage(err instanceof Error ? err.message : 'Unable to find nearby hospitals.');
    }
  }, []);

  useEffect(() => {
    if (step === 3 && hospitalStatus === 'idle') {
      void detectHospitals();
    }
  }, [step, hospitalStatus, detectHospitals]);

  useEffect(() => {
    if (hospitalPrefetch.current || step < 1) return;
    const token = getAuthToken();
    if (!token) return;
    hospitalPrefetch.current = true;
    void (async () => {
      try {
        const coords = await getUserLocation();
        await fetchNearbyHospitals(token, coords);
      } catch {
        hospitalPrefetch.current = false;
      }
    })();
  }, [step]);

  const toggleHospital = (hospital: NearbyHospital) => {
    setSelectedHospitals((prev) => {
      const exists = prev.some((item) => item.osm_id === hospital.osm_id);
      if (exists) {
        return prev.filter((item) => item.osm_id !== hospital.osm_id);
      }
      if (prev.length >= MAX_PREFERRED_HOSPITALS) {
        return prev;
      }
      return [...prev, hospital];
    });
  };

  const isSelected = (hospital: NearbyHospital) =>
    selectedHospitals.some((item) => item.osm_id === hospital.osm_id);

  const combinedConditions = useMemo(() => {
    const filtered = chronicConditions.filter((item) => item !== 'Other');
    const other = otherCondition
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return [...filtered, ...other];
  }, [chronicConditions, otherCondition]);

  const goNext = () => {
    setStepError('');
    if (step === 0) {
      if (!age || !gender) {
        setStepError('Please fill your age and gender to continue.');
        return;
      }
    }
    if (step === 2) {
      if (!guardianPhone.trim()) {
        setStepError('An emergency contact number is required.');
        return;
      }
    }
    setStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const goBack = () => {
    setStepError('');
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleFinish = async () => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const medicalHistory = [
        `Allergy Reaction: ${allergyReaction || 'Not specified'}`,
        'Pregnancy: No',
        'Breastfeeding: No',
        `Chronic Conditions: ${combinedConditions.length ? combinedConditions.join(', ') : 'None'}`,
      ].join('\n');

      const payload = {
        age: age ? Number(age) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
        gender: gender || null,
        blood_group: bloodGroup || null,
        past_surgeries: pastSurgeries || null,
        guardian_name: guardianName || null,
        guardian_relation: guardianRelation || null,
        guardian_phone: guardianPhone || null,
        allergies: parseList(allergies),
        current_medicines: parseList(currentMedicines),
        medical_history: medicalHistory,
        preferred_hospitals: selectedHospitals.map((hospital) => ({
          osm_id: hospital.osm_id,
          name: hospital.name,
          address: hospital.address,
          phone: hospital.phone,
          speciality: hospital.speciality || null,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
        })),
      };

      const result = await fetchApiJson<ProfileApiPayload>('/profile', {
        token,
        method: 'POST',
        body: payload,
      });

      if (!result.response.ok || !result.payload?.success) {
        throw new Error(result.payload?.message || 'Unable to save your details');
      }

      window.dispatchEvent(new CustomEvent('profile-updated'));
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your details');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto min-h-screen max-w-5xl px-4 pt-32 pb-24">
          <section className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-8">
            <p className="text-on-surface-variant">Loading your details...</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-5xl px-4 pt-32 pb-24 sm:px-6">
        <section className="mb-8 rounded-3xl border border-primary/20 bg-primary/10 p-6 animate-slide-up">
          <h1 className="font-display text-2xl font-black text-primary">Finish your emergency setup</h1>
          <p className="mt-2 text-on-surface-variant">
            Add the remaining details so we can reach the right hospital and your emergency contact fast.
          </p>
        </section>

        <div className="mb-8 flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                index === step
                  ? 'bg-primary text-white'
                  : index < step
                    ? 'bg-primary/15 text-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-[11px]">
                {index + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 sm:p-8 animate-slide-up">
          {step === 0 ? (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Basic details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  type="number"
                  label="Age"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  required
                />
                <div className="flex w-full flex-col gap-2">
                  <label className="text-sm font-medium text-on-surface-variant">Gender</label>
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value as typeof gender)}
                    className="rounded-xl bg-surface-container-high px-4 py-3 text-on-surface outline-none"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  type="number"
                  label="Weight (kg)"
                  min={1}
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                />
                <Input
                  type="number"
                  label="Height (cm)"
                  min={1}
                  step="0.1"
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                />
                <div className="flex w-full flex-col gap-2">
                  <label className="text-sm font-medium text-on-surface-variant">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(event) => setBloodGroup(event.target.value)}
                    className="rounded-xl bg-surface-container-high px-4 py-3 text-on-surface outline-none"
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Medical information</h2>
              <Input
                type="text"
                label="Current Medications"
                placeholder="e.g. Aspirin, Metformin"
                value={currentMedicines}
                onChange={(event) => setCurrentMedicines(event.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  type="text"
                  label="Known Allergies"
                  placeholder="e.g. Penicillin, Peanuts"
                  value={allergies}
                  onChange={(event) => setAllergies(event.target.value)}
                />
                <div className="flex w-full flex-col gap-2">
                  <label className="text-sm font-medium text-on-surface-variant">Typical Reaction</label>
                  <select
                    value={allergyReaction}
                    onChange={(event) => setAllergyReaction(event.target.value)}
                    className="rounded-xl bg-surface-container-high px-4 py-3 text-on-surface outline-none"
                  >
                    <option value="">Select reaction</option>
                    <option value="Mild (Rash, Itching)">Mild (Rash, Itching)</option>
                    <option value="Moderate (Swelling, Hives)">Moderate (Swelling, Hives)</option>
                    <option value="Severe (Difficulty breathing)">Severe (Difficulty breathing)</option>
                    <option value="Anaphylaxis">Anaphylaxis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-on-surface-variant">
                  Chronic Conditions
                </label>
                <div className="flex flex-wrap gap-2">
                  {chronicConditionOptions.map((condition) => {
                    const selected = chronicConditions.includes(condition);
                    return (
                      <button
                        key={condition}
                        type="button"
                        onClick={() =>
                          setChronicConditions((prev) =>
                            prev.includes(condition)
                              ? prev.filter((item) => item !== condition)
                              : [...prev, condition]
                          )
                        }
                        className={`rounded-full border px-3 py-2 text-sm transition-all ${
                          selected
                            ? 'border-primary bg-primary/10 font-semibold text-primary'
                            : 'border-outline-variant hover:border-primary'
                        }`}
                      >
                        {condition}
                      </button>
                    );
                  })}
                </div>
                {chronicConditions.includes('Other') ? (
                  <input
                    type="text"
                    value={otherCondition}
                    onChange={(event) => setOtherCondition(event.target.value)}
                    placeholder="Type other condition(s), comma separated..."
                    className="mt-3 w-full rounded-xl bg-surface-container-high px-4 py-3 outline-none"
                  />
                ) : null}
              </div>

              <Input
                type="text"
                label="Past Operations / Surgeries"
                placeholder="e.g. Appendix removed (2021)"
                value={pastSurgeries}
                onChange={(event) => setPastSurgeries(event.target.value)}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Guardian / Emergency Contact</h2>
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50 px-4 py-3">
                <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <p className="text-sm text-amber-800">
                  This number and person will be contacted with your details <strong>in case of an emergency</strong>.
                  Please keep it accurate and up to date.
                </p>
              </div>
              <Input
                type="text"
                label="Guardian / Emergency Contact Name"
                placeholder="e.g. Ramesh Kumar"
                value={guardianName}
                onChange={(event) => setGuardianName(event.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  type="text"
                  label="Relationship"
                  placeholder="e.g. Father, Spouse"
                  value={guardianRelation}
                  onChange={(event) => setGuardianRelation(event.target.value)}
                />
                <Input
                  type="tel"
                  label="Emergency Contact Number"
                  placeholder="e.g. +91 98765 43210"
                  value={guardianPhone}
                  onChange={(event) => setGuardianPhone(event.target.value)}
                  required
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-primary">Preferred Emergency Hospitals</h2>
                  <p className="text-sm text-on-surface-variant">
                    Select up to {MAX_PREFERRED_HOSPITALS} hospitals within 10 km. They appear first when you press
                    the emergency button.
                  </p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => void detectHospitals()}>
                  <Icon name="near_me" className="mr-2 h-4 w-4" />
                  {hospitalStatus === 'loading' ? 'Locating...' : 'Find nearby hospitals'}
                </Button>
              </div>

              {hospitalStatus === 'error' ? (
                <p className="rounded-xl border border-error/40 bg-error-container/40 px-4 py-3 text-sm text-error">
                  {hospitalMessage || 'Still searching for nearby hospitals... Please retry if it is taking too long.'}
                </p>
              ) : null}

              {selectedHospitals.length ? (
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-primary">
                    Selected ({selectedHospitals.length}/{MAX_PREFERRED_HOSPITALS})
                  </p>
                  <div className="space-y-3">
                    {selectedHospitals.map((hospital) => (
                      <HospitalCard
                        key={hospital.osm_id}
                        hospital={hospital}
                        accent="preferred"
                        selectable
                        selected
                        onToggleSelect={toggleHospital}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {hospitalStatus === 'ready' ? (
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-on-surface-variant">
                    Nearby hospitals
                  </p>
                  {nearbyHospitals.filter((hospital) => !isSelected(hospital)).length ? (
                    <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                      {nearbyHospitals
                        .filter((hospital) => !isSelected(hospital))
                        .map((hospital) => (
                          <HospitalCard
                            key={hospital.osm_id}
                            hospital={hospital}
                            selectable
                            selected={false}
                            onToggleSelect={toggleHospital}
                            disabled={selectedHospitals.length >= MAX_PREFERRED_HOSPITALS}
                          />
                        ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                      {hospitalMessage || 'Still searching for nearby hospitals...'}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {stepError ? (
            <p className="mt-5 rounded-xl bg-error-container/40 px-4 py-3 text-sm text-error">{stepError}</p>
          ) : null}
          {error ? (
            <p className="mt-5 rounded-xl bg-error-container/40 px-4 py-3 text-sm text-error">{error}</p>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={goBack}
              disabled={step === 0 || isSaving}
              className={step === 0 ? 'invisible' : ''}
            >
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button type="button" variant="primary" onClick={goNext}>
                Continue
                <Icon name="arrow_forward" className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={() => void handleFinish()} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Finish setup'}
                <Icon name="check_circle" className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="text-sm font-semibold text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
            >
              Skip for now
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
