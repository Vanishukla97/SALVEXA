const asyncHandler = require('../utils/asyncHandler');
const HealthProfileModel = require('../models/HealthProfileModel');
const PreferredHospitalModel = require('../models/PreferredHospitalModel');
const { normalizeListInput } = require('../utils/parser');
const { isEmergencySetupComplete } = require('../services/emergencyService');

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

function getAvatarUrl(req, profile) {
  if (!req || !profile || !profile.avatar_path) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${profile.avatar_path}`;
}

function normalizeProfile(profile, req, extra = {}) {
  if (!profile) return null;
  return {
    ...profile,
    avatar_url: getAvatarUrl(req, profile),
    allergies: parseJsonList(profile.allergies),
    current_medicines: parseJsonList(profile.current_medicines),
    preferred_hospitals: extra.preferred_hospitals || [],
    emergency_setup_complete: Boolean(extra.emergency_setup_complete),
  };
}

const upsertProfile = asyncHandler(async (req, res) => {
  const payload = {
    age: req.body.age,
    weight: req.body.weight,
    height: req.body.height,
    gender: req.body.gender,
    blood_group: req.body.blood_group,
    medical_history: req.body.medical_history,
    past_surgeries: req.body.past_surgeries,
    guardian_name: req.body.guardian_name,
    guardian_relation: req.body.guardian_relation,
    guardian_phone: req.body.guardian_phone,
    allergies: normalizeListInput(req.body.allergies),
    current_medicines: normalizeListInput(req.body.current_medicines),
  };

  const updated = await HealthProfileModel.upsertByUserId(req.user.userId, payload);

  let preferredHospitals = await PreferredHospitalModel.listByUser(req.user.userId);
  if (Array.isArray(req.body.preferred_hospitals)) {
    preferredHospitals = await PreferredHospitalModel.replaceForUser(
      req.user.userId,
      req.body.preferred_hospitals
    );
  }

  return res.status(200).json({
    success: true,
    message: 'Health profile saved',
    data: normalizeProfile(updated, req, {
      preferred_hospitals: preferredHospitals,
      emergency_setup_complete: isEmergencySetupComplete(updated, preferredHospitals),
    }),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await HealthProfileModel.getByUserId(req.user.userId);
  const preferredHospitals = await PreferredHospitalModel.listByUser(req.user.userId);
  return res.status(200).json({
    success: true,
    data: normalizeProfile(profile, req, {
      preferred_hospitals: preferredHospitals,
      emergency_setup_complete: isEmergencySetupComplete(profile, preferredHospitals),
    }),
  });
});

const deleteProfile = asyncHandler(async (req, res) => {
  await HealthProfileModel.deleteByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    message: 'Health profile deleted',
  });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const avatarPath = req.file.filename;
  await HealthProfileModel.setAvatarPath(req.user.userId, avatarPath);
  const profile = await HealthProfileModel.getByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    message: 'Avatar uploaded',
    data: { avatar_url: getAvatarUrl(req, profile) },
  });
});

const clearMedicalHistory = asyncHandler(async (req, res) => {
  await HealthProfileModel.clearMedicalHistory(req.user.userId);
  return res.status(200).json({
    success: true,
    message: 'Medical history cleared',
  });
});

module.exports = {
  upsertProfile,
  getProfile,
  deleteProfile,
  uploadAvatar,
  clearMedicalHistory,
  normalizeProfile,
};
