const UserModel = require('../models/UserModel');
const HealthProfileModel = require('../models/HealthProfileModel');
const SymptomModel = require('../models/SymptomModel');
const PreferredHospitalModel = require('../models/PreferredHospitalModel');
const EmergencyDispatchModel = require('../models/EmergencyDispatchModel');
const { sendSms } = require('./smsService');
const { PRIORITY, createNotification } = require('./notificationService');

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch (error) {
      // Fall back to comma separated parsing.
    }
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function formatSymptoms(symptoms = []) {
  const parts = symptoms
    .map((row) => {
      const list = parseJsonList(row.symptoms_list);
      const text = row.symptom_text ? String(row.symptom_text).trim() : '';
      const label = text || list.join(', ');
      if (!label) return null;
      const severity = row.severity != null ? ` (severity ${row.severity}/10)` : '';
      return `${label}${severity}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join('; ') : null;
}

function extractGuardian(profile) {
  return {
    name: profile?.guardian_name || null,
    relation: profile?.guardian_relation || null,
    phone: profile?.guardian_phone || null,
  };
}

function buildPatientSnapshot({ user, profile, symptoms, guardian }) {
  return {
    name: user?.name || null,
    age: profile?.age ?? null,
    gender: profile?.gender || null,
    blood_group: profile?.blood_group || null,
    allergies: parseJsonList(profile?.allergies),
    current_medicines: parseJsonList(profile?.current_medicines),
    medical_history: profile?.medical_history || null,
    past_surgeries: profile?.past_surgeries || null,
    recent_symptoms: formatSymptoms(symptoms),
    guardian,
  };
}

function buildEmergencyMessage({ user, profile, symptoms, guardian, hospital, location }) {
  const allergies = parseJsonList(profile?.allergies);
  const medicines = parseJsonList(profile?.current_medicines);
  const conditions = [
    profile?.medical_history ? String(profile.medical_history).replace(/\s+/g, ' ').trim() : null,
    profile?.past_surgeries ? `Surgeries: ${profile.past_surgeries}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
  const recentSymptoms = formatSymptoms(symptoms);
  const locationText =
    location && location.lat != null && location.lng != null
      ? `${location.lat},${location.lng}`
      : 'Location unavailable';

  return [
    'SALVEXA EMERGENCY SOS',
    `Patient: ${user?.name || 'Unknown'} | Age: ${profile?.age ?? 'NA'} | Blood: ${profile?.blood_group || 'Unknown'} | Gender: ${profile?.gender || 'NA'}`,
    `Allergies: ${allergies.length ? allergies.join(', ') : 'None reported'}`,
    `Medications: ${medicines.length ? medicines.join(', ') : 'None reported'}`,
    `Conditions/Surgeries: ${conditions || 'None reported'}`,
    `Recent symptoms (last 3 days): ${recentSymptoms || 'None recorded'}`,
    `Location: ${locationText}`,
    `Emergency contact: ${guardian?.name || 'Not provided'}${guardian?.relation ? ` (${guardian.relation})` : ''} - ${guardian?.phone || 'Not provided'}`,
    hospital?.name ? `Destination hospital: ${hospital.name}` : null,
    'This is an automated emergency alert sent via Salvexa.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function getPatientContext(userId) {
  const [user, profile, symptoms, preferredHospitals] = await Promise.all([
    UserModel.findById(userId),
    HealthProfileModel.getByUserId(userId),
    SymptomModel.listRecentByUser(userId, 3),
    PreferredHospitalModel.listByUser(userId),
  ]);
  const guardian = extractGuardian(profile);
  const snapshot = buildPatientSnapshot({ user, profile, symptoms, guardian });
  return { user, profile, symptoms, guardian, snapshot, preferredHospitals };
}

function isEmergencySetupComplete(profile, preferredHospitals = []) {
  const hasGuardian = Boolean(profile?.guardian_phone);
  const hasBloodGroup = Boolean(profile?.blood_group);
  const hasHospital = Array.isArray(preferredHospitals) && preferredHospitals.length > 0;
  return hasGuardian && hasBloodGroup && hasHospital;
}

async function dispatchEmergency({ userId, hospital = null, location = null }) {
  const { user, profile, symptoms, guardian, snapshot } = await getPatientContext(userId);

  const message = buildEmergencyMessage({
    user,
    profile,
    symptoms,
    guardian,
    hospital,
    location,
  });

  const hospitalPhone = hospital?.phone || null;
  const guardianPhone = guardian?.phone || null;

  const hospitalResult = await sendSms({
    to: hospitalPhone,
    message,
    recipientType: 'hospital',
  });
  const guardianResult = guardianPhone
    ? await sendSms({ to: guardianPhone, message, recipientType: 'guardian' })
    : { status: 'skipped', provider: 'none', error: 'No guardian phone number on file' };

  const statuses = [hospitalResult.status, guardianResult.status];
  const overallStatus = statuses.includes('sent')
    ? 'sent'
    : statuses.includes('mock')
      ? 'mock'
      : statuses.includes('queued')
        ? 'queued'
        : 'failed';

  const dispatchId = await EmergencyDispatchModel.createDispatch({
    userId,
    hospital,
    guardianPhone,
    patientSnapshot: snapshot,
    messageBody: message,
    location,
    status: overallStatus,
  });

  await EmergencyDispatchModel.createSmsLog({
    userId,
    dispatchId,
    recipientType: 'hospital',
    recipientPhone: hospitalPhone || 'unknown',
    message,
    provider: hospitalResult.provider,
    status: hospitalResult.status,
    errorMessage: hospitalResult.error || null,
  });

  if (guardianPhone) {
    await EmergencyDispatchModel.createSmsLog({
      userId,
      dispatchId,
      recipientType: 'guardian',
      recipientPhone: guardianPhone,
      message,
      provider: guardianResult.provider,
      status: guardianResult.status,
      errorMessage: guardianResult.error || null,
    });
  }

  try {
    await createNotification({
      userId,
      type: 'emergency_event',
      priority: PRIORITY.CRITICAL,
      title: 'Emergency SOS sent',
      message: `Emergency alert sent to ${hospital?.name || 'the selected hospital'}${guardianPhone ? ' and your emergency contact' : ''}.`,
      deepLink: '/profile?emergency=1',
      deliveredAt: new Date(),
      meta: { dispatchId, hospital: hospital?.name || null },
    });
  } catch (error) {
    // Notification failure should never block the emergency dispatch.
  }

  return {
    dispatchId,
    status: overallStatus,
    message,
    recipients: {
      hospital: { name: hospital?.name || null, phone: hospitalPhone, status: hospitalResult.status },
      guardian: { name: guardian?.name || null, phone: guardianPhone, status: guardianResult.status },
    },
  };
}

module.exports = {
  parseJsonList,
  buildPatientSnapshot,
  buildEmergencyMessage,
  getPatientContext,
  isEmergencySetupComplete,
  dispatchEmergency,
};
