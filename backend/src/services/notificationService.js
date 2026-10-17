const NotificationModel = require('../models/NotificationModel');
const { heuristicTriage } = require('./aiTriageService');
const UserSettingsModel = require('../models/UserSettingsModel');

const PRIORITY = {
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  INFO: 'info',
};

async function createNotification(input) {
  return NotificationModel.createNotification(input);
}

async function createPrescriptionScanReadyNotification({ userId, prescriptionId }) {
  const settings = await UserSettingsModel.getByUserId(userId);
  if (!Number(settings?.medication_reminders)) {
    return null;
  }

  return createNotification({
    userId,
    type: 'scan_ready',
    priority: PRIORITY.IMPORTANT,
    title: 'Prescription analysis is ready',
    message: 'Your prescription analysis is ready. Tap to review.',
    deepLink: `/scanner?report=${prescriptionId}`,
    deliveredAt: new Date(),
    meta: { prescriptionId },
  });
}

async function createFollowUpCheckNotifications({
  userId,
  symptomRecordId,
  symptoms = [],
  symptomText = '',
  severity = null,
}) {
  const settings = await UserSettingsModel.getByUserId(userId);
  if (!Number(settings?.symptom_tracking_alerts)) {
    return;
  }

  const triage = heuristicTriage(symptoms, symptomText);
  const isCritical = triage.triage === 'urgent_care' || Number(severity || 0) >= 7;
  const priority = isCritical ? PRIORITY.CRITICAL : PRIORITY.IMPORTANT;
  const hoursList = [6, 12, 24];

  for (const hours of hoursList) {
    const scheduled = new Date(Date.now() + hours * 60 * 60 * 1000);
    await createNotification({
      userId,
      type: 'followup_check',
      priority,
      title: 'Re-check symptoms',
      message: `Re-check symptoms after ${hours} hours.`,
      deepLink: `/symptoms?followup=1&source=${symptomRecordId}`,
      scheduledFor: scheduled,
      deliveredAt: null,
      meta: {
        symptomRecordId,
        hours,
        triage: triage.triage,
      },
    });
  }
}

async function createWeeklyReportNotificationIfEnabled({ userId }) {
  const settings = await UserSettingsModel.getByUserId(userId);
  if (!Number(settings?.weekly_health_reports)) {
    return null;
  }

  const existsRecent = await NotificationModel.hasRecentTypeNotification({
    userId,
    type: 'weekly_report',
    hours: 24 * 7,
  });
  if (existsRecent) return null;

  return createNotification({
    userId,
    type: 'weekly_report',
    priority: PRIORITY.INFO,
    title: 'Weekly health summary is ready',
    message: 'Your weekly AI health summary is available. Review your latest activity.',
    deepLink: '/medical-history',
    deliveredAt: new Date(),
  });
}

async function createEmergencyTriggerNotifications({ userId, location = null }) {
  const createdAt = new Date();
  await createNotification({
    userId,
    type: 'emergency_event',
    priority: PRIORITY.CRITICAL,
    title: 'Ambulance call initiated',
    message: 'Emergency flow activated. Ambulance call has been initiated.',
    deepLink: '/profile?emergency=1',
    deliveredAt: createdAt,
    meta: { event: 'ambulance_call' },
  });

  await createNotification({
    userId,
    type: 'emergency_event',
    priority: PRIORITY.CRITICAL,
    title: 'Location shared',
    message: 'Your live location has been shared for emergency assistance.',
    deepLink: '/profile?emergency=1',
    deliveredAt: createdAt,
    meta: {
      event: 'location_shared',
      location: location || null,
    },
  });
}

async function ensureProfileCompletionNotification({ userId, profile }) {
  const missingAge = !profile || profile.age == null;
  const allergies = Array.isArray(profile?.allergies) ? profile.allergies : [];
  const currentMeds = Array.isArray(profile?.current_medicines) ? profile.current_medicines : [];
  const missingAllergies = allergies.length === 0;
  const missingMeds = currentMeds.length === 0;

  if (!missingAge && !missingAllergies && !missingMeds) return;

  const existsRecent = await NotificationModel.hasRecentTypeNotification({
    userId,
    type: 'profile_incomplete',
    hours: 24,
  });
  if (existsRecent) return;

  await createNotification({
    userId,
    type: 'profile_incomplete',
    priority: PRIORITY.IMPORTANT,
    title: 'Complete your health profile',
    message: 'Complete profile for safer recommendations.',
    deepLink: '/profile?complete=1',
    deliveredAt: new Date(),
    meta: {
      missingAge,
      missingAllergies,
      missingMeds,
    },
  });
}

async function deliverDueNotifications() {
  return NotificationModel.deliverDueScheduled();
}

module.exports = {
  PRIORITY,
  createNotification,
  createPrescriptionScanReadyNotification,
  createFollowUpCheckNotifications,
  createEmergencyTriggerNotifications,
  ensureProfileCompletionNotification,
  createWeeklyReportNotificationIfEnabled,
  deliverDueNotifications,
};
