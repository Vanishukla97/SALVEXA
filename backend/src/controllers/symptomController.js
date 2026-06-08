const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const SymptomModel = require('../models/SymptomModel');
const { normalizeListInput } = require('../utils/parser');
const { createFollowUpCheckNotifications } = require('../services/notificationService');

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

function normalizeSymptomRow(row) {
  return {
    ...row,
    symptoms_list: parseJsonList(row.symptoms_list),
  };
}

const createSymptom = asyncHandler(async (req, res) => {
  const payload = {
    symptoms: normalizeListInput(req.body.symptoms),
    symptom_text: req.body.symptom_text,
    duration: req.body.duration,
    severity: req.body.severity,
    frequency: req.body.frequency,
  };

  const id = await SymptomModel.createSymptomRecord(req.user.userId, payload);
  const created = await SymptomModel.getById(id, req.user.userId);

  await createFollowUpCheckNotifications({
    userId: req.user.userId,
    symptomRecordId: id,
    symptoms: payload.symptoms,
    symptomText: payload.symptom_text || '',
    severity: payload.severity || null,
  });

  return res.status(201).json({
    success: true,
    message: 'Symptoms saved',
    data: normalizeSymptomRow(created),
  });
});

const listSymptoms = asyncHandler(async (req, res) => {
  const rows = await SymptomModel.listByUser(req.user.userId);
  return res.status(200).json({
    success: true,
    data: rows.map(normalizeSymptomRow),
  });
});

const getSymptomById = asyncHandler(async (req, res) => {
  const row = await SymptomModel.getById(req.params.id, req.user.userId);
  if (!row) throw new ApiError(404, 'Symptom record not found');
  return res.status(200).json({
    success: true,
    data: normalizeSymptomRow(row),
  });
});

const updateSymptom = asyncHandler(async (req, res) => {
  const payload = {
    symptoms: normalizeListInput(req.body.symptoms),
    symptom_text: req.body.symptom_text,
    duration: req.body.duration,
    severity: req.body.severity,
    frequency: req.body.frequency,
  };
  const updated = await SymptomModel.updateById(req.params.id, req.user.userId, payload);
  if (!updated) throw new ApiError(404, 'Symptom record not found');
  const row = await SymptomModel.getById(req.params.id, req.user.userId);
  return res.status(200).json({
    success: true,
    message: 'Symptoms updated',
    data: normalizeSymptomRow(row),
  });
});

const deleteSymptom = asyncHandler(async (req, res) => {
  const deleted = await SymptomModel.deleteById(req.params.id, req.user.userId);
  if (!deleted) throw new ApiError(404, 'Symptom record not found');
  return res.status(200).json({
    success: true,
    message: 'Symptom record deleted',
  });
});

module.exports = {
  createSymptom,
  listSymptoms,
  getSymptomById,
  updateSymptom,
  deleteSymptom,
};
