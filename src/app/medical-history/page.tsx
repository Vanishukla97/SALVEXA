'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { Icon } from '../../components/ui/Icon';
import { clearAuthSession, getAuthToken } from '../../lib/auth';
import { fetchApiJson } from '../../lib/api';

type SymptomRecord = {
  id: number;
  symptoms_list: string[];
  symptom_text: string | null;
  created_at: string;
  severity: number | null;
};

type RecommendationRecord = {
  id: number;
  symptom_record_id: number;
  medicine_name: string | null;
  dosage: string | null;
  instructions: string | null;
  is_safe: number;
  created_at: string;
};

type SymptomApiRow = {
  id: number | string;
  symptoms_list?: unknown;
  symptom_text?: string | null;
  created_at?: string | null;
  severity?: number | string | null;
};

type RecommendationApiRow = {
  id: number | string;
  symptom_record_id: number | string;
  medicine_name?: string | null;
  dosage?: string | null;
  instructions?: string | null;
  is_safe?: number | string | null;
  created_at?: string | null;
};

type HistoryCard = {
  id: number;
  createdAt: string;
  symptoms: string[];
  notes: string | null;
  severity: number | null;
  diagnosis: string;
  confidence: number;
  isCritical: boolean;
  regimen: Array<{
    id: number;
    medicineName: string;
    dosage: string;
    instructions: string;
    safe: boolean;
  }>;
};

function parseList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : word))
    .join(' ');
}

function formatDateTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildDiagnosis(symptoms: string[], notes: string | null) {
  const text = `${symptoms.join(' ')} ${notes || ''}`.toLowerCase();
  const hasChest =
    text.includes('chest pain') ||
    text.includes('chest discomfort') ||
    text.includes('chest tightness') ||
    text.includes('chest pressure');
  const hasLeftArm =
    text.includes('left arm pain') ||
    text.includes('left shoulder pain') ||
    text.includes('radiating arm pain');
  const hasBreath =
    text.includes('shortness of breath') ||
    text.includes('breathing difficulty') ||
    text.includes('breathlessness');
  const hasVomit = text.includes('vomit') || text.includes('vomiting') || text.includes('nausea');

  if ((hasChest && hasBreath) || (hasChest && hasLeftArm) || (hasChest && hasBreath && hasVomit)) {
    return 'Possible Acute Cardiac Emergency';
  }

  if (notes && notes.trim()) return toTitleCase(notes.trim()).slice(0, 40);
  if (symptoms.length >= 2) return `${toTitleCase(symptoms[0])} Pattern`;
  if (symptoms.length === 1) return `${toTitleCase(symptoms[0])} Episode`;
  return 'General Clinical Review';
}

export default function MedicalHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyCards, setHistoryCards] = useState<HistoryCard[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const [symptomsRes, recommendationsRes] = await Promise.all([
          fetchApiJson<{ success?: boolean; message?: string; data?: SymptomApiRow[] }>('/symptoms', {
            token,
          }),
          fetchApiJson<{ success?: boolean; message?: string; data?: RecommendationApiRow[] }>('/recommendations', {
            token,
          }),
        ]);

        const symptomsPayload = symptomsRes.payload;
        const recommendationsPayload = recommendationsRes.payload;

        if (symptomsRes.response.status === 401 || recommendationsRes.response.status === 401) {
          clearAuthSession();
          router.replace('/login');
          return;
        }

        if (!symptomsRes.response.ok || !symptomsPayload?.success) {
          throw new Error(symptomsPayload?.message || 'Unable to load symptom history');
        }
        if (!recommendationsRes.response.ok || !recommendationsPayload?.success) {
          throw new Error(recommendationsPayload?.message || 'Unable to load recommendation history');
        }

        const symptomRows: SymptomApiRow[] = Array.isArray(symptomsPayload.data)
          ? symptomsPayload.data
          : [];
        const recommendationRows: RecommendationApiRow[] = Array.isArray(recommendationsPayload.data)
          ? recommendationsPayload.data
          : [];

        const symptoms: SymptomRecord[] = symptomRows.map((item) => ({
          id: Number(item.id),
          symptoms_list: parseList(item.symptoms_list),
          symptom_text: item.symptom_text ? String(item.symptom_text) : null,
          created_at: String(item.created_at || ''),
          severity: item.severity != null ? Number(item.severity) : null,
        }));

        const recommendations: RecommendationRecord[] = recommendationRows.map(
          (item) => ({
            id: Number(item.id),
            symptom_record_id: Number(item.symptom_record_id),
            medicine_name: item.medicine_name ? String(item.medicine_name) : null,
            dosage: item.dosage ? String(item.dosage) : null,
            instructions: item.instructions ? String(item.instructions) : null,
            is_safe: Number(item.is_safe || 0),
            created_at: String(item.created_at || ''),
          })
        );

        const recMap = new Map<number, RecommendationRecord[]>();
        for (const rec of recommendations) {
          const existing = recMap.get(rec.symptom_record_id) || [];
          existing.push(rec);
          recMap.set(rec.symptom_record_id, existing);
        }

        const cards: HistoryCard[] = symptoms.map((symptom) => {
          const linked = recMap.get(symptom.id) || [];
          const regimen = linked.slice(0, 3).map((rec) => ({
            id: rec.id,
            medicineName: rec.medicine_name || 'Suggested medicine',
            dosage: rec.dosage || 'As advised',
            instructions: rec.instructions || 'Follow guidance',
            safe: rec.is_safe === 1,
          }));
          const confidence = symptom.severity != null
            ? Math.max(70, Math.min(98, 72 + symptom.severity * 3))
            : 86;
          const diagnosis = buildDiagnosis(symptom.symptoms_list, symptom.symptom_text);
          const isCritical = diagnosis.toLowerCase().includes('cardiac emergency');

          return {
            id: symptom.id,
            createdAt: symptom.created_at,
            symptoms: symptom.symptoms_list,
            notes: symptom.symptom_text,
            severity: symptom.severity,
            diagnosis,
            confidence: isCritical ? 97 : confidence,
            isCritical,
            regimen,
          };
        });

        setHistoryCards(cards);
      } catch (err) {
        if (err instanceof Error && err.message.toLowerCase().includes('failed to fetch')) {
          setError('Unable to connect to backend. Please make sure backend server is running and try again.');
        } else {
          setError(err instanceof Error ? err.message : 'Unable to load medical history');
        }
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [router]);

  const renderedCards = useMemo(
    () => historyCards.filter((card) => !completedIds.includes(card.id)),
    [completedIds, historyCards]
  );

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-4 md:px-6 max-w-7xl mx-auto min-h-screen">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold font-display text-on-surface tracking-tight">
            Medical History
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl text-lg">
            A comprehensive chronicle of your clinical journey. Track past symptoms, AI insights, and recovery milestones.
          </p>
        </header>

        {loading ? (
          <section className="rounded-3xl bg-surface-container-low p-8 border border-outline-variant/20">
            <p className="text-on-surface-variant">Loading medical history...</p>
          </section>
        ) : null}

        {!loading && error ? (
          <section className="rounded-3xl bg-error-container/40 p-8 border border-error/30">
            <p className="text-error font-semibold">{error}</p>
          </section>
        ) : null}

        {!loading && !error ? (
          <section className="relative pl-0 md:pl-10">
            <div className="hidden md:block absolute left-4 top-0 bottom-0 w-px bg-outline-variant/50" />
            <div className="space-y-8">
              {renderedCards.length ? (
                renderedCards.map((card) => (
                  <article key={card.id} className="relative">
                    <div className="hidden md:flex absolute -left-1 top-10 w-8 h-8 rounded-full bg-primary text-white items-center justify-center shadow-lg">
                      <Icon name="history" className="h-4 w-4" />
                    </div>

                    <div className="bg-surface-container-lowest rounded-[1.75rem] p-6 md:p-8 border border-outline-variant/20 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                        <div>
                          <p className="text-primary text-sm font-bold">
                            {formatDateTime(card.createdAt)}
                          </p>
                          <h2 className="text-2xl font-bold font-display text-on-surface">
                            Patient Consultation ID #{card.id}
                          </h2>
                        </div>
                        <span className="self-start md:self-auto px-4 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-black uppercase tracking-wider">
                          {card.isCritical ? 'Critical' : 'Ongoing'}
                        </span>
                      </div>

                      {card.isCritical ? (
                        <div className="mb-5 rounded-2xl border border-error/40 bg-error-container/50 px-4 py-3">
                          <p className="text-sm font-bold text-error">
                            Serious heart-related warning signs detected. Please consult the nearest hospital or emergency doctor immediately.
                          </p>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-surface-container-low rounded-2xl p-5">
                          <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-3">
                            Symptoms
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(card.symptoms.length ? card.symptoms : ['General discomfort']).map((symptom, index) => (
                              <span
                                key={`${card.id}-${symptom}-${index}`}
                                className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-sm font-semibold"
                              >
                                {toTitleCase(symptom)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div
                          className={`bg-surface-container-low rounded-2xl p-5 border-l-4 ${
                            card.isCritical ? 'border-error' : 'border-primary'
                          }`}
                        >
                          <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">
                            AI Diagnosis
                          </p>
                          <h3 className={`text-2xl font-bold mb-1 ${card.isCritical ? 'text-error' : 'text-primary'}`}>
                            {card.diagnosis}
                          </h3>
                          <p className="text-sm text-on-surface-variant">
                            Probability confidence: {card.confidence}%
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-3">
                          Recommended Regimen
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {card.regimen.length ? (
                            card.regimen.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 bg-secondary-container/35 rounded-2xl px-4 py-3 min-w-[220px]"
                              >
                                <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                                  <Icon name="pill" className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-on-surface">{item.medicineName}</p>
                                  <p className="text-xs text-on-surface-variant">
                                    {item.dosage} • {item.instructions}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-on-surface-variant">
                              No recommendation generated yet for this consultation.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-outline-variant/25 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => router.push('/recommendations')}
                          className="px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-container transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompletedIds((prev) => [...prev, card.id])}
                          className="px-6 py-2.5 rounded-full bg-surface-container-high text-primary font-bold hover:bg-surface-container-low transition-colors"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <article className="bg-surface-container-lowest rounded-[1.75rem] p-8 border border-outline-variant/20">
                  <h2 className="text-2xl font-bold font-display text-on-surface mb-2">No medical history yet</h2>
                  <p className="text-on-surface-variant">
                    Symptoms submit karo, phir recommendations generate karo. Uske baad yaha auto-history cards dikhne lagenge.
                  </p>
                </article>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
