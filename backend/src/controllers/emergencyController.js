const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { findNearbyHospitals, haversineKm } = require('../services/hospitalService');
const {
  dispatchEmergency,
  getPatientContext,
  buildEmergencyMessage,
  isEmergencySetupComplete,
} = require('../services/emergencyService');
const PreferredHospitalModel = require('../models/PreferredHospitalModel');

function parseCoord(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRadius(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return env.hospital.defaultRadiusKm;
  return Math.min(50, Math.max(1, parsed));
}

function withDistance(hospital, origin) {
  if (origin && hospital.latitude != null && hospital.longitude != null) {
    return {
      ...hospital,
      distance_km: Number(
        haversineKm(origin.lat, origin.lng, Number(hospital.latitude), Number(hospital.longitude)).toFixed(2)
      ),
    };
  }
  return hospital;
}

const listNearbyHospitals = asyncHandler(async (req, res) => {
  const lat = parseCoord(req.query.lat);
  const lng = parseCoord(req.query.lng);
  if (lat == null || lng == null) {
    throw new ApiError(400, 'Valid lat and lng query parameters are required');
  }
  const radiusKm = parseRadius(req.query.radiusKm);
  const origin = { lat, lng };

  let hospitals = [];
  let source = 'overpass';
  let error = null;
  try {
    const result = await findNearbyHospitals({ lat, lng, radiusKm });
    hospitals = result.hospitals;
    source = result.source;
  } catch (err) {
    source = 'unavailable';
    error = err.message;
    hospitals = [];
  }

  const preferred = await PreferredHospitalModel.listByUser(req.user.userId);
  const preferredIds = new Set(preferred.map((hospital) => hospital.osm_id));

  return res.status(200).json({
    success: true,
    data: {
      radiusKm,
      source,
      error,
      preferred: preferred.map((hospital) => ({
        ...withDistance(hospital, origin),
        is_preferred: true,
      })),
      hospitals: hospitals.map((hospital) => ({
        ...hospital,
        is_preferred: preferredIds.has(hospital.osm_id),
      })),
    },
  });
});

const getEmergencyContext = asyncHandler(async (req, res) => {
  const lat = parseCoord(req.query.lat);
  const lng = parseCoord(req.query.lng);
  const radiusKm = parseRadius(req.query.radiusKm);
  const origin = lat != null && lng != null ? { lat, lng } : null;

  const context = await getPatientContext(req.user.userId);

  const preferredHospitals = context.preferredHospitals.map((hospital) => ({
    ...withDistance(hospital, origin),
    is_preferred: true,
  }));

  const messagePreview = buildEmergencyMessage({
    user: context.user,
    profile: context.profile,
    symptoms: context.symptoms,
    guardian: context.guardian,
    hospital: null,
    location: origin,
  });

  return res.status(200).json({
    success: true,
    data: {
      radiusKm,
      source: 'skipped',
      error: null,
      setupComplete: isEmergencySetupComplete(context.profile, context.preferredHospitals),
      guardian: context.guardian,
      profile: {
        name: context.user?.name || null,
        age: context.profile?.age ?? null,
        gender: context.profile?.gender ?? null,
        blood_group: context.profile?.blood_group ?? null,
        allergies: context.snapshot?.allergies || [],
        current_medicines: context.snapshot?.current_medicines || [],
        recent_symptoms: context.snapshot?.recent_symptoms || null,
      },
      messagePreview,
      preferredHospitals,
      otherHospitals: [],
    },
  });
});

const triggerEmergency = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const lat = parseCoord(body.lat);
  const lng = parseCoord(body.lng);
  const location = lat != null && lng != null ? { lat, lng } : null;

  const rawHospital = body.hospital && typeof body.hospital === 'object' ? body.hospital : null;
  if (!rawHospital) {
    throw new ApiError(400, 'A hospital selection is required to send an emergency alert');
  }

  const hospital = {
    osm_id: rawHospital.osm_id ? String(rawHospital.osm_id) : null,
    name: rawHospital.name ? String(rawHospital.name) : null,
    address: rawHospital.address ? String(rawHospital.address) : null,
    phone: rawHospital.phone ? String(rawHospital.phone) : null,
    latitude: parseCoord(rawHospital.latitude),
    longitude: parseCoord(rawHospital.longitude),
  };

  if (!hospital.osm_id && !hospital.name) {
    throw new ApiError(400, 'Hospital selection is missing an identifier or name');
  }

  const result = await dispatchEmergency({
    userId: req.user.userId,
    hospital,
    location,
  });

  return res.status(200).json({
    success: true,
    message: 'Emergency alert dispatched',
    data: result,
  });
});

module.exports = {
  listNearbyHospitals,
  getEmergencyContext,
  triggerEmergency,
};
