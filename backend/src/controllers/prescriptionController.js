const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const PrescriptionModel = require('../models/PrescriptionModel');
const {
  extractTextFromFile,
  extractMedicinesFromText,
  analyzePrescriptionWithAI,
  deriveLikelyIndication,
} = require('../services/ocrService');
const { createPrescriptionScanReadyNotification } = require('../services/notificationService');

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [value];
    }
  }
  return [];
}

function parseJsonObject(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  return null;
}

const scanPrescription = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Prescription image is required');
  }

  const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
  const ruleBasedMedicines = await extractMedicinesFromText(extractedText);
  const aiAnalysis = await analyzePrescriptionWithAI({
    filePath: req.file.path,
    mimeType: req.file.mimetype,
    ocrText: extractedText,
    ruleBasedMedicines,
  });

  const aiMedicineNames = (aiAnalysis.medicines || [])
    .map((medicine) => medicine.name)
    .filter(Boolean);
  const extractedMedicines = Array.from(new Set([...ruleBasedMedicines, ...aiMedicineNames]));

  const analysisPayload = {
    source: aiAnalysis.source,
    summary: aiAnalysis.summary,
    cleanedExtractedText: aiAnalysis.cleanedExtractedText || extractedText,
    patientFriendlyInterpretation: aiAnalysis.patientFriendlyInterpretation || '',
    likelyIndication:
      aiAnalysis.likelyIndication || deriveLikelyIndication(extractedMedicines),
    likelyCondition:
      aiAnalysis.likelyCondition || deriveLikelyIndication(extractedMedicines),
    doctorName: aiAnalysis.doctorName || '',
    doctorSpecialization: aiAnalysis.doctorSpecialization || '',
    clinicName: aiAnalysis.clinicName || '',
    prescriptionDate: aiAnalysis.prescriptionDate || '',
    patientName: aiAnalysis.patientName || '',
    patientAge: aiAnalysis.patientAge || '',
    diagnosisNotes: aiAnalysis.diagnosisNotes || [],
    patientConditions: aiAnalysis.patientConditions || [],
    behavioralNotes: aiAnalysis.behavioralNotes || [],
    confidenceScore: aiAnalysis.confidenceScore,
    requiresDoctorReview: aiAnalysis.requiresDoctorReview,
    handwritingQuality: aiAnalysis.handwritingQuality,
    lowOcrConfidence:
      Boolean(aiAnalysis.lowOcrConfidence)
      || aiAnalysis.handwritingQuality === 'poor'
      || Number(aiAnalysis.confidenceScore || 0) < 0.65,
    medicineDetails: aiAnalysis.medicines || [],
    medicinePlan: aiAnalysis.medicinePlan || [],
    medicineAlternatives: aiAnalysis.medicineAlternatives || [],
    dosageNotes: aiAnalysis.dosageNotes || [],
    instructions: aiAnalysis.instructions || [],
    warnings: aiAnalysis.warnings || [],
    handwritingNote:
      req.file.mimetype === 'application/pdf'
        ? 'PDF parsed successfully. If this is a scanned handwritten PDF, manual verification is still recommended.'
        : aiAnalysis.handwritingQuality === 'poor'
          ? 'Handwriting quality appears difficult. Please verify all medicines and doses with a doctor/pharmacist.'
          : 'OCR + AI analysis complete. Manual doctor/pharmacist verification is still recommended.',
  };

  const prescriptionId = await PrescriptionModel.createPrescription({
    userId: req.user.userId,
    imagePath: req.file.path,
    extractedText,
    extractedMedicines,
    analysis: analysisPayload,
  });

  await createPrescriptionScanReadyNotification({
    userId: req.user.userId,
    prescriptionId,
  });

  return res.status(200).json({
    success: true,
    message: 'Prescription scanned successfully',
    data: {
      prescriptionId,
      extractedText,
      extractedMedicines,
      analysis: analysisPayload,
    },
  });
});

const listPrescriptions = asyncHandler(async (req, res) => {
  const rows = await PrescriptionModel.listByUser(req.user.userId);
  const data = rows.map((row) => ({
    ...row,
    extracted_medicines: parseJsonList(row.extracted_medicines),
    analysis_json: parseJsonObject(row.analysis_json),
  }));
  return res.status(200).json({ success: true, data });
});

const getPrescriptionById = asyncHandler(async (req, res) => {
  const row = await PrescriptionModel.getById(req.params.id, req.user.userId);
  if (!row) throw new ApiError(404, 'Prescription not found');
  return res.status(200).json({
    success: true,
    data: {
      ...row,
      extracted_medicines: parseJsonList(row.extracted_medicines),
      analysis_json: parseJsonObject(row.analysis_json),
    },
  });
});

module.exports = { scanPrescription, listPrescriptions, getPrescriptionById };
