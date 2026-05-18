const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const SymptomModel = require('../models/SymptomModel');
const HealthProfileModel = require('../models/HealthProfileModel');
const RecommendationModel = require('../models/RecommendationModel');
const { buildRecommendations } = require('../services/recommendationService');
const { normalizeProfile } = require('./healthProfileController');

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeSymptomRow(row) {
  return {
    ...row,
    symptoms_list: parseJsonList(row.symptoms_list),
  };
}

const generateRecommendations = asyncHandler(async (req, res) => {
  const { symptomRecordId } = req.body;
  const symptom = await SymptomModel.getById(symptomRecordId, req.user.userId);
  if (!symptom) {
    throw new ApiError(404, 'Symptom record not found');
  }

  const profile = normalizeProfile(await HealthProfileModel.getByUserId(req.user.userId));
  const normalizedSymptom = normalizeSymptomRow(symptom);

  const result = await buildRecommendations({
    symptoms: normalizedSymptom.symptoms_list,
    symptomText: normalizedSymptom.symptom_text,
    profile,
  });
  const suggestions = result.recommendations || [];

  const persisted = [];
  for (const item of suggestions) {
    const recommendationReason = `Matched symptoms: ${normalizedSymptom.symptoms_list.join(', ') || 'general'}${normalizedSymptom.symptom_text ? ` | Notes: ${normalizedSymptom.symptom_text}` : ''}${result.analysis?.triage ? ` | Triage: ${result.analysis.triage}` : ''}${result.analysis?.confidenceScore ? ` | Confidence: ${result.analysis.confidenceScore}` : ''}`;
    const recommendationId = await RecommendationModel.createRecommendation({
      userId: req.user.userId,
      symptomRecordId: symptom.id,
      medicineId: item.medicineId,
      dosage: item.dosage,
      instructions: item.instructions,
      warnings: item.warnings.join(' | '),
      warningList: item.warnings,
      recommendationReason,
      isSafe: item.isSafe,
    });
    persisted.push({ recommendationId, ...item });
  }

  return res.status(200).json({
    success: true,
    message: suggestions.length ? 'Recommendations generated' : 'Doctor review suggested before medication recommendation',
    data: persisted,
    analysis: {
      source: result.analysis?.source || 'heuristic',
      normalizedSymptoms: result.analysis?.normalizedSymptoms || normalizedSymptom.symptoms_list,
      possibleConditions: result.analysis?.possibleConditions || [],
      redFlags: result.analysis?.redFlags || [],
      confidenceScore: result.analysis?.confidenceScore ?? null,
      triage: result.analysis?.triage || 'doctor_review',
      clinicalNote: result.analysis?.clinicalNote || '',
    },
    advisory: result.advisory || {
      level: 'doctor_review',
      note: 'Doctor review required before using medication recommendations.',
    },
    disclaimer:
      'AI-assisted medicine guidance is informational only, not a confirmed diagnosis or prescription. Consult a licensed doctor before taking any medicine.',
  });
});

const listRecommendationHistory = asyncHandler(async (req, res) => {
  const rows = await RecommendationModel.listByUser(req.user.userId);
  return res.status(200).json({
    success: true,
    data: rows,
  });
});

const getRecommendationById = asyncHandler(async (req, res) => {
  const row = await RecommendationModel.getById(req.params.id, req.user.userId);
  if (!row) throw new ApiError(404, 'Recommendation not found');
  const safetyChecks = await RecommendationModel.listSafetyChecks(row.id);
  return res.status(200).json({
    success: true,
    data: {
      ...row,
      safety_checks: safetyChecks,
    },
  });
});

module.exports = {
  generateRecommendations,
  listRecommendationHistory,
  getRecommendationById,
};
