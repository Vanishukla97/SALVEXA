const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const MedicineModel = require('../models/MedicineModel');
const env = require('../config/env');

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanupOcrText(rawText) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const filtered = lines.filter((line) => {
    const alphaCount = (line.match(/[a-z]/gi) || []).length;
    const total = line.length || 1;
    const alphaRatio = alphaCount / total;
    return line.length >= 3 && alphaRatio >= 0.25;
  });

  return filtered.join('\n');
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function deriveLikelyIndication(extractedMedicines) {
  const meds = extractedMedicines.map((m) => m.toLowerCase());
  if (meds.some((m) => m.includes('cetirizine') || m.includes('loratadine'))) {
    return 'Likely allergy management plan';
  }
  if (meds.some((m) => m.includes('dextromethorphan'))) {
    return 'Likely cough / upper respiratory treatment';
  }
  if (meds.some((m) => m.includes('paracetamol') || m.includes('ibuprofen'))) {
    return 'Likely fever or pain management';
  }
  if (meds.some((m) => m.includes('ondansetron'))) {
    return 'Likely nausea / vomiting management';
  }
  if (meds.some((m) => m.includes('quetiapine') || m.includes('qutipin') || m.includes('sizodon'))) {
    return 'Likely psychiatric treatment plan';
  }
  return 'General prescription pattern detected';
}

function uniqueStrings(list = []) {
  return Array.from(new Set(list.map((item) => String(item).trim()).filter(Boolean)));
}

function parseJsonObject(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function toSentenceCase(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeScheduleString(value) {
  return String(value || '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, '')
    .trim();
}

function parseDailySlots(schedulePattern) {
  const compact = normalizeScheduleString(schedulePattern);
  const parts = compact.split('-');
  if (parts.length !== 3) {
    return {
      morning: '',
      afternoon: '',
      night: '',
    };
  }

  const parsePart = (part) => {
    const value = String(part || '').trim().toLowerCase();
    if (!value || value === 'x' || value === '0') return 'None';
    if (/^\d+$/.test(value)) return `${value} tablet`;
    return value;
  };

  return {
    morning: parsePart(parts[0]),
    afternoon: parsePart(parts[1]),
    night: parsePart(parts[2]),
  };
}

function deriveFallbackAlternatives(medicineNames = []) {
  const map = [
    {
      match: /rivotril|clonazepam/i,
      forMedicine: 'Rivotril 0.5 mg',
      alternatives: ['Clonazepam 0.5 mg (generic equivalent)'],
      note: 'Use only under psychiatrist supervision.',
    },
    {
      match: /ativan|lorazepam/i,
      forMedicine: 'Ativan (Lorazepam)',
      alternatives: ['Lorazepam 1-2 mg (generic equivalent)'],
      note: 'May cause sedation. Do not self-adjust dose.',
    },
    {
      match: /serta|sertraline/i,
      forMedicine: 'Serta 50 mg',
      alternatives: ['Sertraline 50 mg (generic equivalent)'],
      note: 'Antidepressants require medical follow-up.',
    },
    {
      match: /qutipin|quetiapine/i,
      forMedicine: 'Qutipin 200 mg',
      alternatives: ['Quetiapine 200 mg (generic equivalent)'],
      note: 'Night dosing is common; follow doctor instructions.',
    },
    {
      match: /sizodon|risperidone/i,
      forMedicine: 'Sizodon Plus',
      alternatives: ['Risperidone-based equivalent (as prescribed by psychiatrist)'],
      note: 'Psychiatric medicines must not be switched without doctor approval.',
    },
  ];

  const result = [];
  for (const med of medicineNames) {
    const matched = map.find((item) => item.match.test(med));
    if (matched) result.push(matched);
  }
  return result;
}

function sanitizeAiPrescriptionResult(parsed, fallback) {
  if (!parsed || typeof parsed !== 'object') return fallback;

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : fallback.summary;
  const cleanedExtractedText =
    typeof parsed.cleaned_prescription_text === 'string' && parsed.cleaned_prescription_text.trim()
      ? parsed.cleaned_prescription_text.trim()
      : fallback.cleanedExtractedText;
  const patientFriendlyInterpretation =
    typeof parsed.patient_friendly_interpretation === 'string'
    && parsed.patient_friendly_interpretation.trim()
      ? parsed.patient_friendly_interpretation.trim()
      : fallback.patientFriendlyInterpretation;

  const likelyIndication =
    typeof parsed.likely_indication === 'string' && parsed.likely_indication.trim()
      ? parsed.likely_indication.trim()
      : fallback.likelyIndication;
  const likelyCondition =
    typeof parsed.likely_condition === 'string' && parsed.likely_condition.trim()
      ? parsed.likely_condition.trim()
      : fallback.likelyCondition;

  const medicinesRaw = Array.isArray(parsed.medicines) ? parsed.medicines : [];
  const medicines = medicinesRaw
    .map((item) => ({
      name: String(item?.name || '').trim(),
      saltGeneric: String(item?.salt_generic || item?.generic_name || '').trim(),
      dosage: String(item?.dosage || '').trim(),
      frequency: String(item?.frequency || '').trim(),
      duration: String(item?.duration || '').trim(),
      foodTiming: String(item?.food_timing || '').trim(),
      purposeSimple: String(item?.purpose_simple || '').trim(),
      instructions: String(item?.instructions || '').trim(),
    }))
    .filter((item) => item.name)
    .slice(0, 20);

  const warnings = uniqueStrings(Array.isArray(parsed.warnings) ? parsed.warnings : fallback.warnings);

  const diagnosisNotes = uniqueStrings(
    Array.isArray(parsed.diagnosis_notes)
      ? parsed.diagnosis_notes.map((item) => toSentenceCase(item))
      : fallback.diagnosisNotes
  );

  const patientConditions = uniqueStrings(
    Array.isArray(parsed.patient_conditions)
      ? parsed.patient_conditions.map((item) => toSentenceCase(item))
      : fallback.patientConditions
  );

  const behavioralNotes = uniqueStrings(
    Array.isArray(parsed.behavioral_notes)
      ? parsed.behavioral_notes.map((item) => toSentenceCase(item))
      : fallback.behavioralNotes
  );

  const medicinePlanRaw = Array.isArray(parsed.medicine_plan) ? parsed.medicine_plan : [];
  const medicinePlan = medicinePlanRaw
    .map((item) => {
      const schedulePattern = String(item?.schedule_pattern || item?.dose_pattern || '').trim();
      const slots = parseDailySlots(schedulePattern);
      return {
        name: String(item?.name || '').trim(),
        strength: String(item?.strength || '').trim(),
        schedulePattern,
        morning: String(item?.morning || slots.morning || '').trim(),
        afternoon: String(item?.afternoon || slots.afternoon || '').trim(),
        night: String(item?.night || slots.night || '').trim(),
        purpose: String(item?.purpose || '').trim(),
        note: String(item?.note || '').trim(),
      };
    })
    .filter((item) => item.name)
    .slice(0, 20);

  const alternativesRaw = Array.isArray(parsed.medicine_alternatives) ? parsed.medicine_alternatives : [];
  const medicineAlternatives = alternativesRaw
    .map((item) => ({
      forMedicine: String(item?.for_medicine || '').trim(),
      alternatives: uniqueStrings(Array.isArray(item?.alternatives) ? item.alternatives : []),
      note: String(item?.note || '').trim(),
    }))
    .filter((item) => item.forMedicine || item.alternatives.length);

  const dosageNotes = uniqueStrings(
    medicines.map((item) => [item.dosage, item.frequency].filter(Boolean).join(' - ')).filter(Boolean)
  );

  const instructions = uniqueStrings(medicines.map((item) => item.instructions).filter(Boolean));

  let confidenceScore = Number(parsed.confidence_score);
  if (Number.isNaN(confidenceScore)) confidenceScore = fallback.confidenceScore;
  confidenceScore = Math.max(0.05, Math.min(0.99, confidenceScore));

  const handwritingQualityInput = String(parsed.handwriting_quality || '').toLowerCase();
  const handwritingQuality = ['clear', 'moderate', 'poor', 'unknown'].includes(handwritingQualityInput)
    ? handwritingQualityInput
    : fallback.handwritingQuality;

  const requiresDoctorReview =
    typeof parsed.requires_doctor_review === 'boolean'
      ? parsed.requires_doctor_review
      : fallback.requiresDoctorReview;

  const doctorName =
    typeof parsed.doctor_name === 'string' && parsed.doctor_name.trim()
      ? parsed.doctor_name.trim()
      : fallback.doctorName;
  const doctorSpecialization =
    typeof parsed.doctor_specialization === 'string' && parsed.doctor_specialization.trim()
      ? parsed.doctor_specialization.trim()
      : fallback.doctorSpecialization;
  const clinicName =
    typeof parsed.clinic_name === 'string' && parsed.clinic_name.trim()
      ? parsed.clinic_name.trim()
      : fallback.clinicName;
  const prescriptionDate =
    typeof parsed.prescription_date === 'string' && parsed.prescription_date.trim()
      ? parsed.prescription_date.trim()
      : fallback.prescriptionDate;
  const patientName =
    typeof parsed.patient_name === 'string' && parsed.patient_name.trim()
      ? parsed.patient_name.trim()
      : fallback.patientName;
  const patientAge =
    typeof parsed.patient_age === 'string' && parsed.patient_age.trim()
      ? parsed.patient_age.trim()
      : fallback.patientAge;
  const lowOcrConfidence =
    typeof parsed.low_ocr_confidence === 'boolean'
      ? parsed.low_ocr_confidence
      : fallback.lowOcrConfidence;

  return {
    source: 'openai',
    summary,
    cleanedExtractedText,
    patientFriendlyInterpretation,
    likelyIndication,
    likelyCondition,
    medicines,
    doctorName,
    doctorSpecialization,
    clinicName,
    prescriptionDate,
    patientName,
    patientAge,
    diagnosisNotes,
    patientConditions,
    behavioralNotes,
    medicinePlan,
    medicineAlternatives: medicineAlternatives.length
      ? medicineAlternatives
      : fallback.medicineAlternatives,
    dosageNotes,
    instructions,
    warnings: warnings.length
      ? warnings
      : ['Manual doctor/pharmacist verification is recommended before using this prescription.'],
    confidenceScore,
    requiresDoctorReview,
    handwritingQuality,
    lowOcrConfidence,
  };
}

async function extractTextFromFile(filePath, mimeType) {
  const absolutePath = path.resolve(filePath);
  const ext = path.extname(absolutePath).toLowerCase();
  const isPdf = mimeType === 'application/pdf' || ext === '.pdf';

  if (isPdf) {
    const fileBuffer = fs.readFileSync(absolutePath);
    const parsed = await pdfParse(fileBuffer);
    return parsed.text || '';
  }

  const [pass1, pass2] = await Promise.all([
    Tesseract.recognize(absolutePath, 'eng', {
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1',
    }),
    Tesseract.recognize(absolutePath, 'eng', {
      tessedit_pageseg_mode: '11',
      preserve_interword_spaces: '1',
    }),
  ]);

  const text1 = pass1?.data?.text || '';
  const text2 = pass2?.data?.text || '';
  return [text1, text2].map((chunk) => chunk.trim()).filter(Boolean).join('\n\n');
}

function extractKnownMedicinesFromNoisyText(rawText) {
  const text = normalizeText(rawText);
  const knownPatterns = [
    { pattern: /\bsizodon\b|\brizodon\b|\brisodon\b/, name: 'Sizodon Plus' },
    { pattern: /\bqutipin\b|\bquetiapine\b|\bqutiapin\b/, name: 'Qutipin 200 mg' },
    { pattern: /\bativan\b|\blorazepam\b|\bavivan\b/, name: 'Ativan (Lorazepam) 2 mg' },
    { pattern: /\brivotril\b|\bclonazepam\b|\brivonil\b/, name: 'Rivotril 0.5 mg' },
    { pattern: /\bserta\b|\bsertraline\b|\bseprta\b/, name: 'Serta 50 mg' },
  ];
  return knownPatterns.filter((item) => item.pattern.test(text)).map((item) => item.name);
}

async function extractMedicinesFromText(rawText) {
  const medicines = await MedicineModel.listMedicines();
  const normalizedText = normalizeText(rawText);
  const tokens = normalizedText.split(' ').filter(Boolean);

  const matchedDb = medicines
    .filter((medicine) => {
      const medicineName = normalizeText(medicine.name);
      if (normalizedText.includes(medicineName)) return true;

      const medTokens = medicineName.split(' ').filter(Boolean);
      return medTokens.some((medToken) =>
        tokens.some((token) => {
          if (Math.abs(token.length - medToken.length) > 2) return false;
          const distance = levenshteinDistance(token, medToken);
          return distance <= 2;
        })
      );
    })
    .map((medicine) => medicine.name);

  const knownNoisyMatches = extractKnownMedicinesFromNoisyText(rawText);
  return [...new Set([...matchedDb, ...knownNoisyMatches])];
}

function buildFallbackPrescriptionAnalysis({ ocrText, ruleBasedMedicines }) {
  const cleanedText = cleanupOcrText(ocrText);
  return {
    source: 'heuristic',
    summary: ocrText?.trim()
      ? 'OCR extraction completed. Prescription interpretation is based on best-effort text recognition.'
      : 'Prescription text is unclear. Manual doctor/pharmacist verification is required.',
    likelyIndication: deriveLikelyIndication(ruleBasedMedicines),
    likelyCondition: deriveLikelyIndication(ruleBasedMedicines),
    cleanedExtractedText: cleanedText || String(ocrText || '').trim(),
    patientFriendlyInterpretation:
      'This prescription was processed using OCR fallback mode. Please verify every medicine and dosage with a doctor or pharmacist.',
    medicines: ruleBasedMedicines.map((name) => ({
      name,
      saltGeneric: '',
      dosage: '',
      frequency: '',
      duration: '',
      foodTiming: '',
      purposeSimple: '',
      instructions: '',
    })),
    doctorName: '',
    doctorSpecialization: '',
    clinicName: '',
    prescriptionDate: '',
    patientName: '',
    patientAge: '',
    diagnosisNotes: [],
    patientConditions: [],
    behavioralNotes: [],
    medicinePlan: [],
    medicineAlternatives: deriveFallbackAlternatives(ruleBasedMedicines),
    dosageNotes: [],
    instructions: [],
    warnings: ['AI analysis is unavailable or uncertain. Please verify medicine name and dosage manually.'],
    confidenceScore: ruleBasedMedicines.length ? 0.6 : 0.4,
    requiresDoctorReview: true,
    handwritingQuality: 'unknown',
    lowOcrConfidence: true,
  };
}

function shouldAttachImageForVision(filePath, mimeType) {
  if (!String(mimeType || '').startsWith('image/')) return false;
  try {
    const stats = fs.statSync(path.resolve(filePath));
    return stats.size > 0 && stats.size <= env.openai.visionMaxImageBytes;
  } catch (error) {
    return false;
  }
}

function imageToDataUrl(filePath, mimeType) {
  const buffer = fs.readFileSync(path.resolve(filePath));
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

async function analyzePrescriptionWithAI({ filePath, mimeType, ocrText, ruleBasedMedicines = [] }) {
  const fallback = buildFallbackPrescriptionAnalysis({ ocrText, ruleBasedMedicines });

  if (!env.openai.apiKey) {
    return {
      ...fallback,
      warnings: [...fallback.warnings, 'OpenAI key is not configured. Running on OCR fallback mode only.'],
    };
  }

  const content = [
    {
      type: 'text',
      text: `OCR text from prescription:\n${String(ocrText || '').slice(0, 7000) || 'No OCR text extracted.'}`,
    },
    {
      type: 'text',
      text: `Rule-based detected medicines: ${ruleBasedMedicines.join(', ') || 'none'}`,
    },
    {
      type: 'text',
      text: 'Return only strict JSON with keys: summary, cleaned_prescription_text, patient_friendly_interpretation, doctor_name, doctor_specialization, clinic_name, prescription_date, patient_name, patient_age, diagnosis_notes, patient_conditions, behavioral_notes, likely_indication, likely_condition, medicines, medicine_plan, medicine_alternatives, warnings, confidence_score, requires_doctor_review, handwriting_quality, low_ocr_confidence. medicines is array of {name, salt_generic, dosage, frequency, duration, food_timing, purpose_simple, instructions}. medicine_plan is array of {name, strength, schedule_pattern, morning, afternoon, night, purpose, note}. medicine_alternatives is array of {for_medicine, alternatives, note}. Expand abbreviations OD/BD/SOS/HS/1-0-1 into clear patient language in frequency/instructions. If text is unclear set low_ocr_confidence=true and requires_doctor_review=true.',
    },
  ];

  if (shouldAttachImageForVision(filePath, mimeType)) {
    content.push({
      type: 'image_url',
      image_url: {
        url: imageToDataUrl(filePath, mimeType),
      },
    });
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), env.openai.timeoutMs);

  try {
    const response = await fetch(`${env.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openai.apiKey}`,
      },
      signal: abortController.signal,
      body: JSON.stringify({
        model: env.openai.prescriptionModel,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a clinical prescription interpretation assistant. Interpret cautiously and clearly. Never claim confirmed diagnosis. For uncertainty keep requires_doctor_review=true and include warnings.',
          },
          {
            role: 'user',
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        ...fallback,
        warnings: [...fallback.warnings, 'OpenAI prescription analysis failed. Falling back to OCR result only.'],
      };
    }

    const payload = await response.json();
    const rawContent = payload?.choices?.[0]?.message?.content || '';
    const parsed = parseJsonObject(rawContent);
    return sanitizeAiPrescriptionResult(parsed, fallback);
  } catch (error) {
    return {
      ...fallback,
      warnings: [...fallback.warnings, 'OpenAI analysis timeout/failure. Fallback OCR analysis applied.'],
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  extractTextFromFile,
  extractMedicinesFromText,
  analyzePrescriptionWithAI,
  deriveLikelyIndication,
};
