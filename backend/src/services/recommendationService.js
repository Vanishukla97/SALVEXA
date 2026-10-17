const MedicineModel = require('../models/MedicineModel');
const { runSafetyChecks } = require('./safetyService');
const env = require('../config/env');
const { analyzeSymptomsWithAI } = require('./aiTriageService');

const symptomRuleMap = {
  fever: ['Paracetamol'],
  headache: ['Paracetamol', 'Ibuprofen'],
  pain: ['Ibuprofen'],
  cough: ['Dextromethorphan'],
  cold: ['Cetirizine'],
  allergy: ['Cetirizine'],
  nausea: ['Ondansetron'],
  acidity: ['Pantoprazole'],
  dizziness: ['Paracetamol'],
  fatigue: ['Paracetamol'],
  sore_throat: ['Paracetamol', 'Cetirizine'],
  diarrhea: ['Ondansetron'],
};

function deriveMedicineCandidates(symptoms = [], symptomText = '') {
  const candidates = new Set();
  const normalized = [
    ...symptoms.map((s) => String(s).toLowerCase()),
    ...String(symptomText).toLowerCase().split(/\s+/),
  ];

  for (const token of normalized) {
    for (const [keyword, medicineNames] of Object.entries(symptomRuleMap)) {
      if (token.includes(keyword)) {
        medicineNames.forEach((name) => candidates.add(name));
      }
    }
  }

  if (candidates.size === 0) {
    candidates.add('Paracetamol');
  }
  return Array.from(candidates);
}

async function buildRecommendations({ symptoms, symptomText, profile }) {
  const analysis = await analyzeSymptomsWithAI({ symptoms, symptomText });
  const candidateNames = deriveMedicineCandidates(
    analysis.normalizedSymptoms?.length ? analysis.normalizedSymptoms : symptoms,
    symptomText
  );
  const requiresDoctorReview =
    analysis.triage !== 'self_care' ||
    analysis.confidenceScore < env.openai.lowConfidenceThreshold;

  if (analysis.triage === 'urgent_care') {
    const isCardiacEmergency = Array.isArray(analysis.redFlags)
      && analysis.redFlags.some((flag) =>
        ['cardiac_emergency_pattern', 'chest_discomfort', 'left_arm_pain', 'chest_pain'].includes(flag.name)
      );

    return {
      recommendations: [],
      analysis,
      advisory: {
        level: 'urgent',
        note: isCardiacEmergency
          ? 'Serious heart-related warning signs detected. Go to the nearest hospital or emergency doctor immediately.'
          : 'Urgent warning signs detected. Please consult emergency medical care immediately.',
      },
    };
  }

  const suggestions = [];

  for (const candidateName of candidateNames) {
    const medicine = await MedicineModel.findByName(candidateName);
    if (!medicine) continue;

    const safety = runSafetyChecks({ medicine, profile });
    const warnings = [...safety.warnings];

    if (requiresDoctorReview) {
      warnings.push(
        'AI confidence is low or symptoms require doctor review. Use recommendations only after clinician confirmation.'
      );
    }

    suggestions.push({
      medicineId: medicine.id,
      medicineName: medicine.name,
      dosage: medicine.default_dosage,
      instructions: medicine.instructions,
      warnings,
      isSafe: warnings.length === 0,
    });
  }

  const advisory =
    requiresDoctorReview
      ? {
          level: 'doctor_review',
          note: 'Doctor review required before starting or changing any medication.',
        }
      : {
          level: 'standard',
          note: 'AI-assisted guidance only. This is not a confirmed diagnosis.',
        };

  return {
    recommendations: suggestions,
    analysis,
    advisory,
  };
}

module.exports = {
  buildRecommendations,
};
