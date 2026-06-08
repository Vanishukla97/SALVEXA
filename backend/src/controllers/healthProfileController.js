const asyncHandler = require('../utils/asyncHandler');
const HealthProfileModel = require('../models/HealthProfileModel');
const { normalizeListInput } = require('../utils/parser');

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

function normalizeProfile(profile, req) {
  if (!profile) return null;
  return {
    ...profile,
    avatar_url: getAvatarUrl(req, profile),
    allergies: parseJsonList(profile.allergies),
    current_medicines: parseJsonList(profile.current_medicines),
  };
}

const upsertProfile = asyncHandler(async (req, res) => {
  const payload = {
    age: req.body.age,
    weight: req.body.weight,
    height: req.body.height,
    gender: req.body.gender,
    medical_history: req.body.medical_history,
    allergies: normalizeListInput(req.body.allergies),
    current_medicines: normalizeListInput(req.body.current_medicines),
  };

  const updated = await HealthProfileModel.upsertByUserId(req.user.userId, payload);
  return res.status(200).json({
    success: true,
    message: 'Health profile saved',
    data: normalizeProfile(updated, req),
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await HealthProfileModel.getByUserId(req.user.userId);
  return res.status(200).json({
    success: true,
    data: normalizeProfile(profile, req),
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
