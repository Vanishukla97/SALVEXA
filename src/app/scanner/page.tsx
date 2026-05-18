/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { getApiBaseUrl, getAuthToken } from '../../lib/auth';
import { fetchApiJson } from '../../lib/api';

type MedicineDetail = {
  name: string;
  saltGeneric?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  foodTiming?: string;
  purposeSimple?: string;
  instructions?: string;
};

type MedicineAlternative = {
  forMedicine?: string;
  alternatives?: string[];
  note?: string;
};

type ScanData = {
  prescriptionId: number;
  extractedMedicines: string[];
  analysis?: {
    source?: 'heuristic' | 'openai';
    summary?: string;
    patientFriendlyInterpretation?: string;
    likelyCondition?: string;
    likelyIndication?: string;
    doctorName?: string;
    doctorSpecialization?: string;
    clinicName?: string;
    prescriptionDate?: string;
    patientName?: string;
    patientAge?: string;
    diagnosisNotes?: string[];
    patientConditions?: string[];
    behavioralNotes?: string[];
    confidenceScore?: number;
    requiresDoctorReview?: boolean;
    lowOcrConfidence?: boolean;
    medicineDetails?: MedicineDetail[];
    medicineAlternatives?: MedicineAlternative[];
    warnings?: string[];
  };
};

function safeText(value?: string) {
  const trimmed = String(value || '').trim();
  return trimmed || 'Not clearly identified';
}

export default function Scanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPdfFile, setIsPdfFile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [inputResetKey, setInputResetKey] = useState(0);
  const [isLoadingSavedReport, setIsLoadingSavedReport] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const reportId = searchParams.get('report');
    if (!reportId) return;

    const token = getAuthToken();
    if (!token) return;

    const numericId = Number(reportId);
    if (!Number.isFinite(numericId) || numericId <= 0) return;

    const loadSavedReport = async () => {
      setIsLoadingSavedReport(true);
      setError('');
      try {
        const result = await fetchApiJson<{
          success?: boolean;
          message?: string;
          data?: {
            id: number;
            extracted_medicines?: string[] | string;
            analysis_json?: ScanData['analysis'] | null;
          };
        }>(`/prescriptions/${numericId}`, { token });

        if (!result.response.ok || !result.payload?.success || !result.payload.data) {
          throw new Error(result.payload?.message || 'Unable to load saved scan report');
        }

        const row = result.payload.data;
        const extracted = Array.isArray(row.extracted_medicines)
          ? row.extracted_medicines.map((item) => String(item))
          : typeof row.extracted_medicines === 'string'
            ? (() => {
                try {
                  const parsed = JSON.parse(row.extracted_medicines);
                  return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
                } catch {
                  return [];
                }
              })()
            : [];

        setScanData({
          prescriptionId: Number(row.id),
          extractedMedicines: extracted,
          analysis: row.analysis_json || undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load saved scan report');
      } finally {
        setIsLoadingSavedReport(false);
      }
    };

    void loadSavedReport();
  }, [searchParams]);

  const onSelectFile = (file: File | null) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(lowerName);
    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');

    if (!isImage && !isPdf) {
      setError('Please upload PNG/JPG/JPEG or PDF file.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError('');
    setScanData(null);
    setSelectedFile(file);
    setIsPdfFile(isPdf);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl('');
    setIsPdfFile(false);
    setScanData(null);
    setError('');
    setInputResetKey((prev) => prev + 1);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please upload a prescription first.');
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setError('Please login first to analyze prescription.');
      router.push('/login');
      return;
    }

    setIsScanning(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`${getApiBaseUrl()}/prescriptions/scan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Unable to scan prescription');
      }
      setScanData(payload.data as ScanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to scan prescription');
    } finally {
      setIsScanning(false);
    }
  };

  const confidenceLabel = useMemo(() => {
    const confidence = scanData?.analysis?.confidenceScore;
    if (confidence == null) return 'N/A';
    return `${Math.round(confidence * 100)}%`;
  }, [scanData?.analysis?.confidenceScore]);

  const lowConfidence = useMemo(() => {
    if (!scanData?.analysis) return false;
    return Boolean(scanData.analysis.lowOcrConfidence) || (scanData.analysis.confidenceScore || 0) < 0.65;
  }, [scanData?.analysis]);

  const medicineCards = useMemo(() => {
    const details = scanData?.analysis?.medicineDetails || [];
    if (details.length) return details;
    return (scanData?.extractedMedicines || []).map((name) => ({
      name,
      saltGeneric: '',
      dosage: '',
      frequency: '',
      duration: '',
      foodTiming: '',
      purposeSimple: '',
      instructions: '',
    }));
  }, [scanData]);

  const warnings = useMemo(() => {
    const list = scanData?.analysis?.warnings || [];
    if (list.length) return list;
    return ['Take medicines only under medical supervision and verify with a doctor/pharmacist.'];
  }, [scanData?.analysis?.warnings]);

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
        <section className="mb-12 text-center md:text-left">
          <h1 className="font-display text-5xl font-extrabold text-on-surface tracking-tight mb-4 max-w-4xl">
            Prescription <span className="text-primary">Care Assistant</span>
          </h1>
          <p className="font-body text-on-surface-variant text-lg max-w-3xl">
            Upload a prescription and get a clean, patient-friendly structured explanation. We do not show messy OCR dumps.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <Card variant="glass" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="upload_file" className="h-6 w-6 text-primary" />
                <h2 className="font-display text-xl font-bold">Upload Prescription</h2>
              </div>

              <label className="relative group block bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant hover:border-primary transition-all duration-300 p-10 text-center cursor-pointer overflow-hidden">
                <input
                  key={inputResetKey}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  onChange={(event) => onSelectFile(event.target.files?.[0] || null)}
                />
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="description" className="h-9 w-9 text-primary" />
                </div>
                <p className="font-display font-bold text-lg mb-2 text-on-surface">
                  {selectedFile ? selectedFile.name : 'Choose prescription file'}
                </p>
                <p className="text-on-surface-variant text-sm">
                  PNG, JPG, JPEG, PDF supported
                </p>
              </label>

              <div className="mt-5 aspect-[3/4] bg-surface-container-high rounded-2xl overflow-hidden relative">
                {previewUrl ? (
                  isPdfFile ? (
                    <iframe title="Uploaded prescription preview" src={previewUrl} className="w-full h-full" />
                  ) : (
                    <img alt="Uploaded prescription preview" className="w-full h-full object-cover" src={previewUrl} />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">
                    No document selected
                  </div>
                )}

                {isScanning ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="w-14 h-14 rounded-full border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin mb-3"></div>
                    <span className="font-display font-bold text-white">Analyzing Prescription...</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex gap-3">
                <Button
                  variant="primary"
                  className="flex-1 py-3 flex items-center justify-center gap-2"
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isScanning}
                >
                  <Icon name="diagnosis" className="h-5 w-5" />
                  {isScanning ? 'Analyzing...' : 'Scan & Interpret'}
                </Button>
                <Button
                  variant="secondary"
                  className="py-3"
                  type="button"
                  onClick={handleRemove}
                  disabled={!selectedFile}
                >
                  Remove
                </Button>
              </div>

              {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
              {isLoadingSavedReport ? (
                <p className="mt-2 text-xs text-on-surface-variant">
                  Loading saved report...
                </p>
              ) : null}
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <Card variant="glass" className="p-6 border border-outline-variant/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-on-surface">Structured Prescription Report</h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {scanData ? `Report ID: #RX-${scanData.prescriptionId}` : 'Upload and scan to generate a patient-friendly report'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                  Confidence: {confidenceLabel}
                </span>
              </div>

              {lowConfidence ? (
                <div className="mt-5 rounded-2xl border border-error/35 bg-error-container/45 p-4">
                  <div className="flex items-start gap-2">
                    <Icon name="warning_amber" className="h-5 w-5 text-error mt-0.5" />
                    <p className="text-sm text-error font-semibold">
                      Some prescription text could not be understood clearly. Please upload a clearer image.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Doctor Name</p>
                  <p className="font-semibold text-on-surface">{safeText(scanData?.analysis?.doctorName)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Specialization</p>
                  <p className="font-semibold text-on-surface">{safeText(scanData?.analysis?.doctorSpecialization)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Clinic / Hospital</p>
                  <p className="font-semibold text-on-surface">{safeText(scanData?.analysis?.clinicName)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Date</p>
                  <p className="font-semibold text-on-surface">{safeText(scanData?.analysis?.prescriptionDate)}</p>
                </div>
              </div>
            </Card>

            <Card variant="glass" className="p-6 border border-outline-variant/20">
              <h3 className="font-display text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <Icon name="medication" className="h-5 w-5 text-primary" />
                Identified Medicines
              </h3>

              {medicineCards.length ? (
                <div className="space-y-4">
                  {medicineCards.map((medicine) => (
                    <div key={`${medicine.name}-${medicine.dosage || 'dose'}`} className="rounded-2xl p-5 bg-surface-container-low border border-outline-variant/20">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display font-extrabold text-lg text-on-surface">{medicine.name}</p>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">Medicine</span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <p><span className="font-semibold text-on-surface">Salt / Generic:</span> <span className="text-on-surface-variant">{medicine.saltGeneric || 'Not clearly identified'}</span></p>
                        <p><span className="font-semibold text-on-surface">Dosage:</span> <span className="text-on-surface-variant">{medicine.dosage || 'Not clearly identified'}</span></p>
                        <p><span className="font-semibold text-on-surface">Frequency:</span> <span className="text-on-surface-variant">{medicine.frequency || 'Not clearly identified'}</span></p>
                        <p><span className="font-semibold text-on-surface">Duration:</span> <span className="text-on-surface-variant">{medicine.duration || 'Not clearly identified'}</span></p>
                        <p><span className="font-semibold text-on-surface">Before/After Food:</span> <span className="text-on-surface-variant">{medicine.foodTiming || 'Not clearly identified'}</span></p>
                        <p><span className="font-semibold text-on-surface">Used for:</span> <span className="text-on-surface-variant">{medicine.purposeSimple || 'Not clearly identified'}</span></p>
                      </div>

                      {medicine.instructions ? (
                        <div className="mt-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 p-3 text-sm text-on-surface-variant">
                          <span className="font-semibold text-on-surface">Simple take instruction:</span> {medicine.instructions}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No medicines were confidently identified.</p>
              )}
            </Card>

            <Card variant="glass" className="p-6 border border-outline-variant/20">
              <h3 className="font-display text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
                <Icon name="diagnosis" className="h-5 w-5 text-primary" />
                Possible Health Condition
              </h3>
              <p className="text-on-surface text-base font-semibold">
                {scanData?.analysis?.likelyCondition || scanData?.analysis?.likelyIndication || 'Condition could not be inferred clearly.'}
              </p>
              <p className="mt-3 text-sm text-on-surface-variant">
                This is an AI-generated assumption and not a confirmed diagnosis.
              </p>
              {scanData?.analysis?.patientFriendlyInterpretation ? (
                <div className="mt-4 rounded-2xl bg-primary/5 border border-primary/20 p-4 text-sm text-on-surface-variant whitespace-pre-wrap">
                  {scanData.analysis.patientFriendlyInterpretation}
                </div>
              ) : null}
            </Card>

            <Card variant="glass" className="p-6 border border-outline-variant/20">
              <h3 className="font-display text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
                <Icon name="sync" className="h-5 w-5 text-primary" />
                Medicine Alternatives
              </h3>
              {scanData?.analysis?.medicineAlternatives?.length ? (
                <div className="space-y-3">
                  {scanData.analysis.medicineAlternatives.map((row, index) => (
                    <div key={`${row.forMedicine || 'alt'}-${index}`} className="rounded-2xl p-4 bg-surface-container-low border border-outline-variant/20">
                      <p className="font-semibold text-on-surface">
                        For: {row.forMedicine || 'Prescription medicine'}
                      </p>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {(row.alternatives || []).join(', ') || 'No clear alternative identified'}
                      </p>
                      {row.note ? <p className="text-xs text-on-surface-variant mt-2">{row.note}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No alternatives identified.</p>
              )}
            </Card>

            <Card variant="glass" className="p-6 border border-error/30 bg-error-container/20">
              <h3 className="font-display text-xl font-bold text-error mb-3 flex items-center gap-2">
                <Icon name="warning_amber" className="h-5 w-5 text-error" />
                Important Warnings
              </h3>
              <div className="space-y-2">
                {warnings.map((warning) => (
                  <p key={warning} className="text-sm text-on-surface-variant">
                    {warning}
                  </p>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
      <PermanentChatbot />
    </>
  );
}
