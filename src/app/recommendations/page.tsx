'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { getApiBaseUrl, getAuthToken } from '../../lib/auth';

type RecommendationItem = {
  recommendationId?: number;
  id?: number;
  medicineName?: string;
  medicine_name?: string;
  dosage?: string | null;
  instructions?: string | null;
  warnings?: string[] | string | null;
  isSafe?: boolean;
  is_safe?: number;
};

type RecommendationPayload = {
  success?: boolean;
  message?: string;
  data?: RecommendationItem[];
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

function parseWarnings(value: RecommendationItem['warnings']) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') {
    return value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export default function RecommendationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<RecommendationPayload | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (typeof window !== 'undefined') {
          const latest = sessionStorage.getItem('salvexa_latest_recommendation');
          if (latest) {
            const parsed = JSON.parse(latest);
            if (parsed?.response) {
              setPayload(parsed.response as RecommendationPayload);
              setIsLoading(false);
              return;
            }
          }
        }

        const response = await fetch(`${getApiBaseUrl()}/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        const responsePayload = await response.json();
        if (!response.ok || !responsePayload?.success) {
          throw new Error(responsePayload?.message || 'Unable to fetch recommendations');
        }
        setPayload({
          success: true,
          data: responsePayload.data || [],
          disclaimer:
            'AI-assisted medicine guidance is informational only and not a substitute for licensed medical advice.',
          advisory: {
            level: 'history',
            note: 'Showing previously generated recommendation history.',
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [router]);

  const normalizedRecommendations = useMemo(() => {
    const rows = payload?.data || [];
    return rows.map((row, index) => {
      const warnings = parseWarnings(row.warnings);
      const safe =
        typeof row.isSafe === 'boolean'
          ? row.isSafe
          : row.is_safe != null
            ? Number(row.is_safe) === 1
            : warnings.length === 0;
      return {
        id: row.recommendationId || row.id || `fallback-${index}`,
        medicineName: row.medicineName || row.medicine_name || 'Medicine',
        dosage: row.dosage || 'As advised',
        instructions: row.instructions || 'Follow doctor/pharmacist instructions',
        warnings,
        safe,
      };
    });
  }, [payload?.data]);

  const confidenceLabel = useMemo(() => {
    const confidence = payload?.analysis?.confidenceScore;
    if (confidence == null) return 'N/A';
    return `${Math.round(confidence * 100)}%`;
  }, [payload?.analysis?.confidenceScore]);

  const isUrgentCase = payload?.analysis?.triage === 'urgent_care' || payload?.advisory?.level === 'urgent';
  const isCardiacFlagged =
    Array.isArray(payload?.analysis?.redFlags)
    && payload.analysis.redFlags.some((flag) =>
      ['cardiac_emergency_pattern', 'chest_discomfort', 'left_arm_pain', 'chest_pain'].includes(flag.name)
    );

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold font-display text-on-surface tracking-tight">
            Medication Insights
          </h1>
          <p className="text-on-surface-variant text-lg mt-3 max-w-3xl">
            Hybrid analysis combines AI symptom normalization with safety checks before showing any guidance.
          </p>
        </header>

        {isLoading ? (
          <Card variant="glass" className="p-8">
            <p className="text-on-surface-variant">Loading recommendations...</p>
          </Card>
        ) : null}

        {!isLoading && error ? (
          <Card variant="glass" className="p-8 border border-error/40">
            <p className="text-error font-semibold">{error}</p>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          <div className="space-y-8">
            {isUrgentCase ? (
              <Card variant="glass" className="p-6 border-2 border-error/50 bg-error-container/45">
                <h2 className="text-xl font-display font-extrabold text-error mb-2">
                  {isCardiacFlagged ? 'Serious Heart Risk Detected' : 'Urgent Medical Risk Detected'}
                </h2>
                <p className="text-sm text-on-surface">
                  {isCardiacFlagged
                    ? 'Symptoms may indicate a serious heart-related emergency. Consult the nearest hospital or emergency doctor immediately.'
                    : 'Serious warning signs are present. Please seek urgent in-person medical care immediately.'}
                </p>
              </Card>
            ) : null}

            <Card variant="glass" className="p-6 border border-outline-variant/20">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                    Clinical Safety Notice
                  </p>
                  <p className="text-sm text-on-surface">
                    {payload?.disclaimer ||
                      'AI-assisted outputs are informational only. Consult a licensed doctor before taking medicines.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    Confidence: {confidenceLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-bold uppercase">
                    Triage: {payload?.analysis?.triage || payload?.advisory?.level || 'history'}
                  </span>
                </div>
              </div>
              {payload?.advisory?.note ? (
                <p className="mt-4 text-sm font-semibold text-primary">{payload.advisory.note}</p>
              ) : null}
              {payload?.analysis?.clinicalNote ? (
                <p className="mt-2 text-sm text-on-surface-variant">{payload.analysis.clinicalNote}</p>
              ) : null}
            </Card>

            {payload?.analysis?.redFlags?.length ? (
              <Card variant="glass" className="p-6 border border-error/30">
                <h2 className="font-display font-bold text-xl mb-4 text-error">Red Flag Alerts</h2>
                <div className="space-y-3">
                  {payload.analysis.redFlags.map((flag) => (
                    <div key={`${flag.name}-${flag.reason}`} className="p-4 rounded-xl bg-error-container/40">
                      <p className="font-bold text-on-surface">{flag.name.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-on-surface-variant">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {normalizedRecommendations.length ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {normalizedRecommendations.map((item) => (
                    <Card
                      key={item.id}
                      variant="glass"
                      className={`p-6 border-l-4 ${item.safe ? 'border-l-secondary' : 'border-l-error'}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h3 className="text-2xl font-display font-bold text-on-surface">{item.medicineName}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.safe ? 'bg-secondary/15 text-secondary' : 'bg-error-container text-error'
                          }`}
                        >
                          {item.safe ? 'Safety Checked' : 'Review Required'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm text-on-surface-variant">
                          <span className="font-semibold text-on-surface">Dosage:</span> {item.dosage}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          <span className="font-semibold text-on-surface">Instructions:</span> {item.instructions}
                        </p>
                      </div>

                      {item.warnings.length ? (
                        <div className="mt-5 p-4 rounded-xl bg-error-container/30 border border-error/20">
                          <p className="text-xs font-bold uppercase tracking-wider text-error mb-2">Warnings</p>
                          <ul className="space-y-2">
                            {item.warnings.map((warning) => (
                              <li key={warning} className="text-sm text-on-surface-variant">
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    variant="secondary"
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => router.push('/symptoms')}
                  >
                    <Icon name="monitoring" className="h-4 w-4" />
                    Recheck Symptoms
                  </Button>
                </div>
              </>
            ) : (
              <Card variant="glass" className="p-8">
                <h3 className="font-display font-bold text-2xl mb-2">No medicine recommendation returned</h3>
                <p className="text-on-surface-variant mb-6">
                  This usually means doctor review is required before suggesting medicines.
                </p>
                <Button
                  variant="primary"
                  type="button"
                  className="flex items-center gap-2"
                  onClick={() => router.push('/symptoms')}
                >
                  Re-analyze Symptoms
                  <Icon name="arrow_forward" className="h-4 w-4" />
                </Button>
              </Card>
            )}
          </div>
        ) : null}
      </main>
    </>
  );
}
