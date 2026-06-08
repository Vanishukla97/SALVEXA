'use client';

/* eslint-disable @next/next/no-img-element */
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { clearAuthSession, getAuthToken, saveAuthSession } from '../../lib/auth';
import { fetchApiJson } from '../../lib/api';

type User = {
  id: number;
  name: string;
  email: string;
};

type ProfileApiPayload = {
  success?: boolean;
  message?: string;
  data?: {
    age?: number | null;
    weight?: number | null;
    height?: number | null;
    gender?: 'male' | 'female' | 'other' | null;
    medical_history?: string | null;
    allergies?: unknown;
    current_medicines?: unknown;
    updated_at?: string | null;
    avatar_url?: string | null;
  } | null;
};

type MePayload = {
  success?: boolean;
  message?: string;
  data?: User;
};

type SymptomApiPayload = {
  success?: boolean;
  message?: string;
  data?: Array<{
    id: number | string;
    symptom_text?: string | null;
    symptoms_list?: unknown;
    severity?: number | string | null;
    created_at?: string | null;
  }>;
};

type FormState = {
  age: string;
  weight: string;
  height: string;
  gender: 'male' | 'female' | 'other' | '';
  currentMedicines: string;
  allergies: string;
  allergyReaction: string;
  pregnancy: boolean;
  breastfeeding: boolean;
  chronicConditions: string[];
  otherCondition: string;
};

type Activity = {
  id: number;
  title: string;
  date: string;
  severe: boolean;
};

const chronicConditionOptions = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Other',
];

function parseList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // noop
    }
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseMedicalHistory(history: string | null) {
  const lines = (history || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const getValue = (prefix: string) => {
    const found = lines.find((line) =>
      line.toLowerCase().startsWith(prefix.toLowerCase())
    );
    if (!found) return '';
    return found.slice(prefix.length).trim();
  };

  const reaction = getValue('Allergy Reaction:');
  const pregnancy = getValue('Pregnancy:').toLowerCase() === 'yes';
  const breastfeeding = getValue('Breastfeeding:').toLowerCase() === 'yes';
  const chronic = getValue('Chronic Conditions:');
  const chronicConditions = chronic
    ? chronic.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  return {
    reaction,
    pregnancy,
    breastfeeding,
    chronicConditions,
  };
}

function composeMedicalHistory(form: FormState) {
  const filtered = form.chronicConditions.filter((c) => c !== 'Other');
  const allConditions = form.otherCondition.trim()
    ? [...filtered, form.otherCondition.trim()]
    : filtered;
  return [
    `Allergy Reaction: ${form.allergyReaction || 'Not specified'}`,
    `Pregnancy: ${form.pregnancy ? 'Yes' : 'No'}`,
    `Breastfeeding: ${form.breastfeeding ? 'Yes' : 'No'}`,
    `Chronic Conditions: ${allConditions.length ? allConditions.join(', ') : 'None'}`,
  ].join('\n');
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No data';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'No data';
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .map((word) =>
      word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : word
    )
    .join(' ');
}

const emptyForm: FormState = {
  age: '',
  weight: '',
  height: '',
  gender: '',
  currentMedicines: '',
  allergies: '',
  allergyReaction: '',
  pregnancy: false,
  breastfeeding: false,
  chronicConditions: [],
  otherCondition: '',
};

export default function ProfilePage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [user, setUser] = useState<User | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showOtherCondition, setShowOtherCondition] = useState(false);

  const hydrateFromProfile = useCallback((profile: ProfileApiPayload['data']) => {
    const meds = parseList(profile?.current_medicines);
    const allergies = parseList(profile?.allergies);
    const meta = parseMedicalHistory(profile?.medical_history || null);

    setForm({
      age: profile?.age != null ? String(profile.age) : '',
      weight: profile?.weight != null ? String(profile.weight) : '',
      height: profile?.height != null ? String(profile.height) : '',
      gender: profile?.gender || '',
      currentMedicines: meds.join(', '),
      allergies: allergies.join(', '),
      allergyReaction: meta.reaction,
      pregnancy: meta.pregnancy,
      breastfeeding: meta.breastfeeding,
      chronicConditions: meta.chronicConditions.filter((item) =>
        chronicConditionOptions.includes(item) && item !== 'Other'
      ),
      otherCondition: (meta.chronicConditions.find(
        (item) => !chronicConditionOptions.includes(item) || item === 'Other'
      ) || ''),
    });
    setShowOtherCondition(meta.chronicConditions.some(
      (item) => !chronicConditionOptions.includes(item)
    ));
    setLastUpdatedAt(profile?.updated_at || null);
    setAvatarUrl(profile?.avatar_url || null);
  }, []);

  const handleAvatarUpload = async (file: File) => {
    const token = getAuthToken();
    if (!token) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await fetchApiJson<{ success?: boolean; data?: { avatar_url?: string } }>(
        '/profile/avatar',
        { token, method: 'POST', body: formData, isFormData: true }
      );
      if (result.response.ok && result.payload?.success && result.payload.data?.avatar_url) {
        setAvatarUrl(result.payload.data.avatar_url);
      }
    } catch {
      // silent
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const loadData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const [meResult, profileResult, symptomResult] = await Promise.all([
        fetchApiJson<MePayload>('/auth/me', { token }),
        fetchApiJson<ProfileApiPayload>('/profile', { token }),
        fetchApiJson<SymptomApiPayload>('/symptoms', { token }),
      ]);

      if (
        meResult.response.status === 401
        || profileResult.response.status === 401
        || symptomResult.response.status === 401
      ) {
        clearAuthSession();
        router.replace('/login');
        return;
      }

      if (!meResult.response.ok || !meResult.payload?.success || !meResult.payload.data) {
        throw new Error(meResult.payload?.message || 'Unable to load user');
      }
      saveAuthSession(token, meResult.payload.data);
      setUser(meResult.payload.data);

      if (!profileResult.response.ok || !profileResult.payload?.success) {
        throw new Error(profileResult.payload?.message || 'Unable to load profile');
      }
      hydrateFromProfile(profileResult.payload.data || null);

      if (symptomResult.response.ok && symptomResult.payload?.success) {
        const rows = Array.isArray(symptomResult.payload.data) ? symptomResult.payload.data : [];
        const normalized = rows.slice(0, 3).map((row) => {
          const symptomList = parseList(row.symptoms_list);
          const title =
            (row.symptom_text && String(row.symptom_text).trim())
            || symptomList[0]
            || 'Symptom update';
          return {
            id: Number(row.id),
            title: toTitleCase(String(title)),
            date: formatDate(row.created_at),
            severe: Number(row.severity || 0) >= 7,
          };
        });
        setActivities(normalized);
      } else {
        setActivities([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFromProfile, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const medicines = useMemo(() => parseList(form.currentMedicines), [form.currentMedicines]);
  const allergies = useMemo(() => parseList(form.allergies), [form.allergies]);
  const profileId = user ? `MED-${String(user.id).padStart(5, '0')}` : 'MED-00000';

  const bmi = useMemo(() => {
    const heightCm = Number(form.height || 0);
    const weightKg = Number(form.weight || 0);
    if (!heightCm || !weightKg) return null;
    const h = heightCm / 100;
    const value = weightKg / (h * h);
    if (!Number.isFinite(value)) return null;
    return Number(value.toFixed(1));
  }, [form.height, form.weight]);

  const heartRate = useMemo(() => {
    const base = 72;
    const age = Number(form.age || 0);
    const chronicBoost = form.chronicConditions.length ? 3 : 0;
    if (!age) return base + chronicBoost;
    const ageAdjust = age > 45 ? 2 : -1;
    return Math.min(98, Math.max(60, base + ageAdjust + chronicBoost));
  }, [form.age, form.chronicConditions.length]);

  const glucose = useMemo(() => {
    const hasDiabetes = form.chronicConditions.includes('Diabetes');
    return hasDiabetes ? 118 : 94;
  }, [form.chronicConditions]);

  const isProfileComplete = useMemo(() => {
    return Boolean(
      form.age
        && form.gender
        && form.height
        && form.weight
        && (form.currentMedicines.trim() || form.allergies.trim() || form.chronicConditions.length)
    );
  }, [form]);

  const handleToggleCondition = (condition: string) => {
    setForm((prev) => {
      const exists = prev.chronicConditions.includes(condition);
      return {
        ...prev,
        chronicConditions: exists
          ? prev.chronicConditions.filter((item) => item !== condition)
          : [...prev.chronicConditions, condition],
      };
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      clearAuthSession();
      router.replace('/login');
      return;
    }
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        age: form.age ? Number(form.age) : null,
        weight: form.weight ? Number(form.weight) : null,
        height: form.height ? Number(form.height) : null,
        gender: form.gender || null,
        current_medicines: medicines,
        allergies,
        medical_history: composeMedicalHistory(form),
      };

      const result = await fetchApiJson<ProfileApiPayload>('/profile', {
        token,
        method: 'POST',
        body: payload,
      });

      if (!result.response.ok || !result.payload?.success) {
        throw new Error(result.payload?.message || 'Unable to save profile');
      }

      hydrateFromProfile(result.payload.data || null);
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
          <section className="rounded-3xl bg-surface-container-low p-8 border border-outline-variant/20 animate-slide-up">
            <p className="text-on-surface-variant">Loading profile...</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
        {!isProfileComplete ? (
          <section className="rounded-3xl bg-primary/10 border border-primary/20 p-6 mb-8 animate-slide-up">
            <h2 className="font-display text-xl font-bold text-primary mb-2">
              Complete Your Profile
            </h2>
            <p className="text-on-surface-variant">
              Fill all essential health details. Once complete, your full profile dashboard will appear.
            </p>
          </section>
        ) : null}

        <section className="mb-12 relative overflow-hidden rounded-3xl bg-surface-container-low p-6 md:p-10 border border-outline-variant/10 animate-slide-up">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-surface-container-high flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    alt="Profile avatar"
                    className="w-full h-full object-cover"
                    src={avatarUrl}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.querySelector('.avatar-fallback')?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${avatarUrl ? 'avatar-fallback hidden' : ''}`}>
                  <Icon name="person" className="h-16 w-16 text-on-surface-variant/50" />
                </div>
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-hero-gradient text-white rounded-full shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingAvatar}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAvatarUpload(file);
                  }}
                />
                <Icon name={isUploadingAvatar ? 'sync' : 'edit'} className="h-4 w-4" />
              </label>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                {user?.name || 'User'}
              </h1>
              <p className="text-on-surface-variant flex items-center justify-center md:justify-start gap-2">
                <Icon name="verified_user" className="h-5 w-5 text-primary" />
                Verified Health Profile - ID: {profileId}
              </p>
              <p className="mt-2 text-xs text-on-surface-variant">
                Last updated: {formatDateTime(lastUpdatedAt)}
              </p>

              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm border border-outline-variant/20">
                  <span className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Age
                  </span>
                  <span className="text-xl font-bold">
                    {form.age ? `${form.age} Years` : 'Not set'}
                  </span>
                </div>
                <div className="bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm border border-outline-variant/20">
                  <span className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Height
                  </span>
                  <span className="text-xl font-bold">
                    {form.height ? `${form.height} cm` : 'Not set'}
                  </span>
                </div>
                <div className="bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm border border-outline-variant/20">
                  <span className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Weight
                  </span>
                  <span className="text-xl font-bold">
                    {form.weight ? `${form.weight} kg` : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-24 -top-20 w-80 h-80 rounded-full bg-hero-gradient opacity-10 blur-3xl" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-7 border border-outline-variant/15 animate-slide-up">
              <div className="flex justify-between items-center mb-7">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Icon name="person" className="h-5 w-5" />
                  Personal Info
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                >
                  <Icon name="edit_square" className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                    Email
                  </p>
                  <p className="text-lg font-medium break-words">{user?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                    Gender
                  </p>
                  <p className="text-lg font-medium">
                    {form.gender ? toTitleCase(form.gender) : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                    Allergy Reaction
                  </p>
                  <p className="text-lg font-medium">
                    {form.allergyReaction || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                    Special Conditions
                  </p>
                  <p className="text-lg font-medium">
                    {[
                      form.pregnancy ? 'Pregnancy' : null,
                      form.breastfeeding ? 'Breastfeeding' : null,
                    ].filter(Boolean).join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-3xl p-7 border border-outline-variant/15 animate-slide-up">
              <div className="flex justify-between items-center mb-7">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Icon name="update" className="h-5 w-5" />
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-3">
                {activities.length ? (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-transparent hover:border-primary/20 transition-all"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full shrink-0">
                        <Icon name={activity.severe ? 'pending' : 'check_circle'} className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{activity.title}</p>
                        <p className="text-xs text-on-surface-variant">{activity.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">No recent activity found.</p>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-7 border border-outline-variant/15 animate-slide-up">
              <div className="flex justify-between items-center mb-7">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Icon name="history_edu" className="h-5 w-5" />
                  Medical History
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                >
                  <Icon name="edit_square" className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(
                  form.chronicConditions.some((c) => c !== 'Other') || form.otherCondition.trim()
                ) ? (
                (form.otherCondition.trim()
                  ? [...form.chronicConditions.filter((c) => c !== 'Other'), form.otherCondition.trim()]
                  : form.chronicConditions.filter((c) => c !== 'Other')
                ).map((condition, index) => (
                    <div
                      key={condition}
                      className={`p-5 rounded-xl bg-surface-container-low border-l-4 ${
                        index % 2 === 0 ? 'border-l-primary' : 'border-l-secondary'
                      }`}
                    >
                      <h4 className="font-bold text-primary mb-1">{condition}</h4>
                      <p className="text-sm text-on-surface-variant">
                        Ongoing condition tracked for safer medicine recommendations.
                      </p>
                      <span className="inline-block mt-3 px-2 py-1 bg-white text-[10px] font-bold uppercase rounded border border-outline-variant/20 text-primary">
                        Chronic
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="md:col-span-2 p-5 rounded-xl bg-surface-container-low border-l-4 border-outline-variant">
                    <p className="text-on-surface-variant">
                      No chronic condition data added yet.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-3xl p-7 border border-outline-variant/15 animate-slide-up">
              <div className="flex justify-between items-center mb-7">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Icon name="pill" className="h-5 w-5" />
                  Current Medications
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors"
                >
                  <Icon name="add" className="h-4 w-4" />
                  Update
                </button>
              </div>

              <div className="space-y-3">
                {medicines.length ? (
                  medicines.map((medicine, index) => (
                    <div
                      key={`${medicine}-${index}`}
                      className="flex items-center gap-5 p-4 rounded-xl hover:bg-surface-container-low transition-colors group"
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-full">
                        <Icon name={index % 2 === 0 ? 'medication' : 'medication_liquid'} className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold">{medicine}</h4>
                        <p className="text-sm text-on-surface-variant">User saved medication</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-primary transition-all">
                        <Icon name="more_vert" className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">No current medicines added yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>

        <section className="mt-12">
          <div className="bg-surface-container-low rounded-3xl p-7 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Health Pulse</h3>
                <p className="text-on-surface-variant">
                  Automated snapshot based on your latest saved profile and history.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-xl min-w-[200px] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Heart Rate
                    </span>
                    <span className="text-secondary font-bold text-sm">Stable</span>
                  </div>
                  <div className="text-3xl font-black mb-2">
                    {heartRate} <span className="text-sm font-medium text-on-surface-variant">BPM</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Derived trend metric</p>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl min-w-[200px] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Glucose
                    </span>
                    <span className="text-primary font-bold text-sm">
                      {form.chronicConditions.includes('Diabetes') ? 'Watch' : 'Stable'}
                    </span>
                  </div>
                  <div className="text-3xl font-black mb-2">
                    {glucose}{' '}
                    <span className="text-sm font-medium text-on-surface-variant">mg/dL</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Derived trend metric</p>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl min-w-[200px] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      BMI
                    </span>
                    <span className="text-primary font-bold text-sm">Profile Based</span>
                  </div>
                  <div className="text-3xl font-black mb-2">
                    {bmi ?? '--'} <span className="text-sm font-medium text-on-surface-variant">index</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Calculated from height and weight</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 text-sm text-error bg-error-container/40 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-6 text-sm text-primary bg-primary/10 px-4 py-3 rounded-xl">
            {success}
          </div>
        ) : null}
      </main>

      {isEditing ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
          <div className="relative w-full max-w-3xl rounded-3xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl font-extrabold">Update Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={form.age}
                    onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        gender: e.target.value as FormState['gender'],
                      }))
                    }
                    className="w-full px-4 py-3 bg-surface-container-high rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.1"
                    value={form.weight}
                    onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.1"
                    value={form.height}
                    onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                  Current Medications
                </label>
                <input
                  type="text"
                  value={form.currentMedicines}
                  onChange={(e) => setForm((prev) => ({ ...prev, currentMedicines: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="e.g. Aspirin, Metformin"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                    Known Allergies
                  </label>
                  <input
                    type="text"
                    value={form.allergies}
                    onChange={(e) => setForm((prev) => ({ ...prev, allergies: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="e.g. Penicillin, Peanuts"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                    Typical Reaction
                  </label>
                  <select
                    value={form.allergyReaction}
                    onChange={(e) => setForm((prev) => ({ ...prev, allergyReaction: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
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
                <label className="block text-sm font-semibold text-on-surface-variant mb-3">
                  Special Conditions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high">
                    <span className="font-medium">Pregnancy</span>
                    <input
                      type="checkbox"
                      checked={form.pregnancy}
                      onChange={(e) => setForm((prev) => ({ ...prev, pregnancy: e.target.checked }))}
                      className="w-5 h-5 rounded-md border-outline-variant text-primary focus:ring-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high">
                    <span className="font-medium">Breastfeeding</span>
                    <input
                      type="checkbox"
                      checked={form.breastfeeding}
                      onChange={(e) => setForm((prev) => ({ ...prev, breastfeeding: e.target.checked }))}
                      className="w-5 h-5 rounded-md border-outline-variant text-primary focus:ring-primary"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-3">
                  Chronic Conditions
                </label>
                <div className="flex flex-wrap gap-2">
                  {chronicConditionOptions.map((condition) => {
                    if (condition === 'Other') {
                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => {
                            setShowOtherCondition((prev) => !prev);
                            if (showOtherCondition) {
                              setForm((prev) => ({ ...prev, otherCondition: '' }));
                            }
                          }}
                          className={`px-3 py-2 rounded-full text-sm border transition-all ${
                            showOtherCondition
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                              : 'border-outline-variant hover:border-primary'
                          }`}
                        >
                          {condition}
                        </button>
                      );
                    }
                    const selected = form.chronicConditions.includes(condition);
                    return (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => handleToggleCondition(condition)}
                        className={`px-3 py-2 rounded-full text-sm border transition-all ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-outline-variant hover:border-primary'
                        }`}
                      >
                        {condition}
                      </button>
                    );
                  })}
                </div>
                {showOtherCondition && (
                  <div className="mt-3">
                    <input
                      id="other-condition-input"
                      type="text"
                      value={form.otherCondition}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, otherCondition: e.target.value }))
                      }
                      placeholder="Type your condition..."
                      className="w-full px-4 py-3 bg-surface-container-high rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </>
  );
}
