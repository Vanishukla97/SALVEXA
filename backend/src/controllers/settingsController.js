const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const UserSettingsModel = require('../models/UserSettingsModel');

function normalizeSettingsRow(row) {
  if (!row) return null;
  return {
    interfaceLanguage: row.interface_language || 'en-US',
    medicationReminders: Boolean(row.medication_reminders),
    symptomTrackingAlerts: Boolean(row.symptom_tracking_alerts),
    weeklyHealthReports: Boolean(row.weekly_health_reports),
    clinicSharingEnabled: Boolean(row.clinic_sharing_enabled),
    animationsEnabled: Boolean(row.animations_enabled),
    updatedAt: row.updated_at,
  };
}

function parseBooleanField(value, fieldName) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value === 1 || value === 0) return Number(value);
  if (value === '1' || value === '0') return Number(value);
  throw new ApiError(400, `Invalid boolean value for ${fieldName}`);
}

const getSettings = asyncHandler(async (req, res) => {
  const row = await UserSettingsModel.getByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    data: normalizeSettingsRow(row),
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const interfaceLanguage = req.body.interfaceLanguage;
  if (
    interfaceLanguage !== undefined
    && (typeof interfaceLanguage !== 'string' || !interfaceLanguage.trim())
  ) {
    throw new ApiError(400, 'Invalid interfaceLanguage');
  }

  const updated = await UserSettingsModel.updateByUserId(req.user.userId, {
    interface_language:
      interfaceLanguage !== undefined ? String(interfaceLanguage).trim() : undefined,
    medication_reminders: parseBooleanField(
      req.body.medicationReminders,
      'medicationReminders'
    ),
    symptom_tracking_alerts: parseBooleanField(
      req.body.symptomTrackingAlerts,
      'symptomTrackingAlerts'
    ),
    weekly_health_reports: parseBooleanField(
      req.body.weeklyHealthReports,
      'weeklyHealthReports'
    ),
    clinic_sharing_enabled: parseBooleanField(
      req.body.clinicSharingEnabled,
      'clinicSharingEnabled'
    ),
    animations_enabled: parseBooleanField(
      req.body.animationsEnabled,
      'animationsEnabled'
    ),
  });

  return res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: normalizeSettingsRow(updated),
  });
});

module.exports = {
  getSettings,
  updateSettings,
};
