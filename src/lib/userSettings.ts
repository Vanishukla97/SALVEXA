export type UserSettings = {
  interfaceLanguage: string;
  medicationReminders: boolean;
  symptomTrackingAlerts: boolean;
  weeklyHealthReports: boolean;
  clinicSharingEnabled: boolean;
  animationsEnabled: boolean;
  updatedAt?: string;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  interfaceLanguage: 'en-US',
  medicationReminders: true,
  symptomTrackingAlerts: true,
  weeklyHealthReports: false,
  clinicSharingEnabled: false,
  animationsEnabled: true,
};

export function normalizeUserSettings(input: unknown): UserSettings {
  const source = typeof input === 'object' && input ? (input as Record<string, unknown>) : {};
  return {
    interfaceLanguage:
      typeof source.interfaceLanguage === 'string' && source.interfaceLanguage.trim()
        ? source.interfaceLanguage
        : DEFAULT_USER_SETTINGS.interfaceLanguage,
    medicationReminders:
      typeof source.medicationReminders === 'boolean'
        ? source.medicationReminders
        : DEFAULT_USER_SETTINGS.medicationReminders,
    symptomTrackingAlerts:
      typeof source.symptomTrackingAlerts === 'boolean'
        ? source.symptomTrackingAlerts
        : DEFAULT_USER_SETTINGS.symptomTrackingAlerts,
    weeklyHealthReports:
      typeof source.weeklyHealthReports === 'boolean'
        ? source.weeklyHealthReports
        : DEFAULT_USER_SETTINGS.weeklyHealthReports,
    clinicSharingEnabled:
      typeof source.clinicSharingEnabled === 'boolean'
        ? source.clinicSharingEnabled
        : DEFAULT_USER_SETTINGS.clinicSharingEnabled,
    animationsEnabled:
      typeof source.animationsEnabled === 'boolean'
        ? source.animationsEnabled
        : DEFAULT_USER_SETTINGS.animationsEnabled,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : undefined,
  };
}
