'use client';

import { FormEvent, KeyboardEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { getApiBaseUrl, getAuthToken } from '../../lib/auth';

const quickSymptoms = ['Headache', 'Fever', 'Fatigue', 'Nausea', 'Cough', 'Body Pain'];

type GenerateResponse = {
  success?: boolean;
  message?: string;
  data?: unknown[];
  analysis?: {
    source?: string;
    normalizedSymptoms?: string[];
    possibleConditions?: string[];
    redFlags?: Array<{ name: string; reason: string; severity: string }>;
    confidenceScore?: number;
    triage?: 'self_care' | 'doctor_review' | 'urgent_care';
    clinicalNote?: string;
  };
  advisory?: {
    level?: string;
    note?: string;
  };
  disclaimer?: string;
};

export default function SymptomsPage() {
  const router = useRouter();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Headache', 'Fever']);
  const [query, setQuery] = useState('');
  const [customSymptom, setCustomSymptom] = useState('');
  const [duration, setDuration] = useState('Less than 24 hours');
  const [frequency, setFrequency] = useState('Occasional');
  const [severity, setSeverity] = useState(4);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredQuickSymptoms = useMemo(
    () => quickSymptoms.filter((item) => item.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((item) => item !== symptom) : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = () => {
    const value = customSymptom.trim();
    if (!value) return;
    const normalized = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    setSelectedSymptoms((prev) => {
      const set = new Set(prev);
      normalized.forEach((item) => set.add(item));
      return Array.from(set);
    });
    setCustomSymptom('');
  };

  const onCustomSymptomKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddCustomSymptom();
    }
  };

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      setError('Please login first to analyze symptoms.');
      router.push('/login');
      return;
    }

    if (!selectedSymptoms.length && !notes.trim()) {
      setError('Please select or enter at least one symptom.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createSymptomRes = await fetch(`${getApiBaseUrl()}/symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          symptom_text: notes.trim() || null,
          duration,
          severity,
          frequency,
        }),
      });

      const createSymptomPayload = await createSymptomRes.json();
      if (!createSymptomRes.ok || !createSymptomPayload?.success) {
        throw new Error(createSymptomPayload?.message || 'Failed to save symptoms');
      }

      const symptomRecordId = createSymptomPayload?.data?.id;
      if (!symptomRecordId) {
        throw new Error('Symptom record ID not received from backend');
      }

      const generateRes = await fetch(`${getApiBaseUrl()}/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          symptomRecordId,
        }),
      });

      const generatePayload: GenerateResponse = await generateRes.json();
      if (!generateRes.ok || !generatePayload?.success) {
        throw new Error(generatePayload?.message || 'Failed to generate recommendations');
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'salvexa_latest_recommendation',
          JSON.stringify({
            createdAt: new Date().toISOString(),
            symptomRecordId,
            selectedSymptoms,
            notes: notes.trim(),
            response: generatePayload,
          })
        );
      }

      router.push('/recommendations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze symptoms');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto min-h-screen">
        <div className="mb-10">
          <h1 className="font-display text-5xl font-extrabold text-on-surface tracking-tight">
            Symptom <span className="text-primary">Input</span>
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl">
            Describe how you feel. We combine AI symptom understanding with safety checks before recommendation output.
          </p>
        </div>

        <form className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" onSubmit={handleAnalyze}>
          <section className="lg:col-span-7 space-y-6">
            <Card variant="glass" className="p-8">
              <label className="block text-on-surface-variant text-sm font-semibold mb-3">
                Add your symptoms
              </label>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Icon name="search" className="h-5 w-5 text-outline-variant" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 text-lg font-medium text-on-surface placeholder:text-outline-variant outline-none"
                  placeholder="Search quick symptoms..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {filteredQuickSymptoms.map((symptom) => {
                  const active = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        active
                          ? 'bg-secondary/15 text-secondary'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-low'
                      }`}
                    >
                      {symptom}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <input
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Type custom symptom (e.g. dizziness) and press Enter"
                  value={customSymptom}
                  onChange={(event) => setCustomSymptom(event.target.value)}
                  onKeyDown={onCustomSymptomKeyDown}
                />
                <Button type="button" variant="secondary" onClick={handleAddCustomSymptom}>
                  Add
                </Button>
              </div>
            </Card>

            <Card variant="glass" className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="priority_high" className="h-5 w-5 text-primary" />
                <h2 className="font-display font-bold text-xl">Selected Symptoms</h2>
              </div>
              {selectedSymptoms.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/10 text-secondary text-sm"
                    >
                      {symptom}
                      <button
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className="hover:text-primary"
                      >
                        <Icon name="close" className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant">No symptoms selected.</p>
              )}
            </Card>

            <Card variant="glass" className="p-8 space-y-4">
              <h3 className="font-display font-bold text-xl">Symptom Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-on-surface-variant">Duration</label>
                  <select
                    className="bg-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                  >
                    <option>Less than 24 hours</option>
                    <option>1-3 days</option>
                    <option>4-7 days</option>
                    <option>More than 1 week</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-on-surface-variant">Frequency</label>
                  <select
                    className="bg-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value)}
                  >
                    <option>Occasional</option>
                    <option>Constant</option>
                    <option>Intermittent</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-on-surface-variant">
                  Severity: <span className="font-bold text-primary">{severity}/10</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={severity}
                  onChange={(event) => setSeverity(Number(event.target.value))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-on-surface-variant">Additional Notes</label>
                <textarea
                  className="w-full min-h-28 px-4 py-3 bg-surface-container-high rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Describe your symptoms in your own words..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </Card>
          </section>

          <section className="lg:col-span-5">
            <Card variant="glass" className="p-8 sticky top-28">
              <h3 className="font-display font-bold text-2xl mb-3">Ready to Analyze</h3>
              <p className="text-on-surface-variant mb-6">
                Hybrid mode: AI symptom normalization + safety rules + doctor-review fallback.
              </p>
              <Button
                variant="primary"
                className="w-full py-4 text-lg flex items-center justify-center gap-2"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Analyzing...' : 'Analyze Symptoms'}
                <Icon name="arrow_forward" className="h-5 w-5" />
              </Button>
              {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
              <p className="mt-4 text-xs text-on-surface-variant">
                AI guidance is informational only. For serious symptoms, urgent doctor consultation is required.
              </p>
            </Card>
          </section>
        </form>
      </main>
      <PermanentChatbot />
    </>
  );
}
