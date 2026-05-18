'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { fetchApiJson } from '../../lib/api';
import { clearAuthSession, getAuthToken } from '../../lib/auth';
import {
  DEFAULT_USER_SETTINGS,
  normalizeUserSettings,
  type UserSettings,
} from '../../lib/userSettings';
import { useUserSettings } from '../../components/providers/UserSettingsProvider';

type SettingsPanel = 'general' | 'security' | 'alerts' | 'data_log';

const sidebarItems: Array<{ id: SettingsPanel; label: string; icon: string }> = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'alerts', label: 'Alerts', icon: 'notifications' },
  { id: 'data_log', label: 'Data Log', icon: 'description' },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all duration-300 ${
        checked ? 'bg-primary animate-soft-pulse' : 'bg-surface-container-highest'
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
          checked ? 'ml-auto' : ''
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { setSettings: setGlobalSettings } = useUserSettings();

  const [activePanel, setActivePanel] = useState<SettingsPanel>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [savedSnapshot, setSavedSnapshot] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [draft, setDraft] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  const loadSettings = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      clearAuthSession();
      router.replace('/login');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const result = await fetchApiJson<{ success?: boolean; message?: string; data?: unknown }>(
        '/settings',
        { token }
      );

      if (result.response.status === 401) {
        clearAuthSession();
        router.replace('/login');
        return;
      }
      if (!result.response.ok || !result.payload?.success || !result.payload.data) {
        throw new Error(result.payload?.message || 'Unable to load settings');
      }

      const normalized = normalizeUserSettings(result.payload.data);
      setSavedSnapshot(normalized);
      setDraft(normalized);
      setGlobalSettings(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [router, setGlobalSettings]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedSnapshot),
    [draft, savedSnapshot]
  );

  const savedOnText = useMemo(() => {
    if (!savedSnapshot.updatedAt) return 'Not saved yet';
    const dt = new Date(savedSnapshot.updatedAt);
    if (Number.isNaN(dt.getTime())) return 'Not saved yet';
    return dt.toLocaleString(draft.interfaceLanguage || 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [savedSnapshot.updatedAt, draft.interfaceLanguage]);

  const showGeneral = activePanel === 'general';
  const showAlerts = activePanel === 'alerts';
  const showSecurity = activePanel === 'security';
  const showDataLog = activePanel === 'data_log';

  const setDraftField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSuccess('');
    setError('');
  };

  const handleDiscardChanges = () => {
    setDraft(savedSnapshot);
    setSuccess('Unsaved changes discarded.');
    setError('');
  };

  const handleSavePreferences = async () => {
    const token = getAuthToken();
    if (!token) {
      clearAuthSession();
      router.replace('/login');
      return;
    }
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await fetchApiJson<{ success?: boolean; message?: string; data?: unknown }>(
        '/settings',
        {
          token,
          method: 'PUT',
          body: {
            interfaceLanguage: draft.interfaceLanguage,
            medicationReminders: draft.medicationReminders,
            symptomTrackingAlerts: draft.symptomTrackingAlerts,
            weeklyHealthReports: draft.weeklyHealthReports,
            clinicSharingEnabled: draft.clinicSharingEnabled,
            animationsEnabled: draft.animationsEnabled,
          },
        }
      );

      if (!result.response.ok || !result.payload?.success || !result.payload.data) {
        throw new Error(result.payload?.message || 'Unable to save settings');
      }

      const normalized = normalizeUserSettings(result.payload.data);
      setSavedSnapshot(normalized);
      setDraft(normalized);
      setGlobalSettings(normalized);
      setSuccess('Preferences saved and applied successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto min-h-screen">
        <header className="mb-10 md:mb-12 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-on-surface mb-2">
            Settings
          </h1>
          <p className="text-on-surface-variant text-base sm:text-lg">
            Manage your clinical preferences, alerts, and account behavior.
          </p>
        </header>

        {isLoading ? (
          <Card variant="glass" className="p-8 animate-slide-up">
            <p className="text-on-surface-variant">Loading your settings...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <aside className="lg:col-span-3">
              <div className="hidden lg:block space-y-2 animate-slide-in-left">
                {sidebarItems.map((item) => {
                  const isActive = activePanel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePanel(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <Icon name={item.icon} className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="lg:hidden -mx-1 px-1 overflow-x-auto pb-1">
                <div className="flex gap-2 min-w-max">
                  {sidebarItems.map((item) => {
                    const isActive = activePanel === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActivePanel(item.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        <Icon name={item.icon} className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-9 space-y-6">
              {(showGeneral || showDataLog) ? (
                <Card variant="glass" className="p-6 sm:p-8 animate-slide-up">
                <div className="flex items-start justify-between mb-7">
                  <div>
                    <h2 className="text-xl font-bold font-display mb-1 text-on-surface">
                      Language & Region
                    </h2>
                    <p className="text-sm text-on-surface-variant font-body">
                      Adjust your interface language and localization settings.
                    </p>
                  </div>
                  <Icon
                    name="language"
                    className="h-9 w-9 text-primary bg-primary/5 p-2 rounded-lg"
                  />
                </div>

                <label className="block text-sm font-semibold text-on-surface-variant ml-1 mb-2">
                  Interface Language
                </label>
                <div className="relative">
                  <select
                    value={draft.interfaceLanguage}
                    onChange={(event) => setDraftField('interfaceLanguage', event.target.value)}
                    className="w-full bg-surface-container-high border-none border-r-8 border-transparent rounded-xl py-4 px-5 outline-none appearance-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium transition-all duration-300"
                  >
                    <option value="en-US">English (United States)</option>
                    <option value="en-IN">English (India)</option>
                    <option value="es-ES">Spanish (ES)</option>
                    <option value="fr-FR">French (FR)</option>
                    <option value="de-DE">German (DE)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Icon name="expand_more" className="h-5 w-5 text-on-surface-variant" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between py-2 border-t border-outline-variant/20">
                  <div>
                    <h3 className="font-semibold text-on-surface">Interface Animations</h3>
                    <p className="text-sm text-on-surface-variant">
                      Smooth transitions and motion effects across the app.
                    </p>
                  </div>
                  <Toggle
                    checked={draft.animationsEnabled}
                    onChange={() =>
                      setDraftField('animationsEnabled', !draft.animationsEnabled)
                    }
                  />
                </div>
              </Card>
              ) : null}

              {(showAlerts || showGeneral) ? (
                <Card variant="glass" className="p-6 sm:p-8 animate-slide-up [animation-delay:80ms]">
                <div className="flex items-start justify-between mb-7">
                  <div>
                    <h2 className="text-xl font-bold font-display mb-1 text-on-surface">
                      Notification Preferences
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Choose how health alerts and follow-ups are generated.
                    </p>
                  </div>
                  <Icon
                    name="notifications_active"
                    className="h-9 w-9 text-primary bg-primary/5 p-2 rounded-lg"
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">Medication Reminders</h3>
                      <p className="text-sm text-on-surface-variant">
                        Prescription scan-ready and dosage reminder notifications.
                      </p>
                    </div>
                    <Toggle
                      checked={draft.medicationReminders}
                      onChange={() =>
                        setDraftField('medicationReminders', !draft.medicationReminders)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">Symptom Tracking Alerts</h3>
                      <p className="text-sm text-on-surface-variant">
                        Follow-up checks after severe symptom submissions (6/12/24h).
                      </p>
                    </div>
                    <Toggle
                      checked={draft.symptomTrackingAlerts}
                      onChange={() =>
                        setDraftField(
                          'symptomTrackingAlerts',
                          !draft.symptomTrackingAlerts
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">Weekly Health Reports</h3>
                      <p className="text-sm text-on-surface-variant">
                        AI digest reminders in notification center (once per week).
                      </p>
                    </div>
                    <Toggle
                      checked={draft.weeklyHealthReports}
                      onChange={() =>
                        setDraftField('weeklyHealthReports', !draft.weeklyHealthReports)
                      }
                    />
                  </div>
                </div>
              </Card>
              ) : null}

              {(showSecurity || showGeneral) ? (
                <Card variant="glass" className="p-6 sm:p-8 animate-slide-up [animation-delay:160ms]">
                <div className="flex items-start justify-between mb-7">
                  <div>
                    <h2 className="text-xl font-bold font-display mb-1 text-on-surface">
                      Privacy & Security
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Manage encryption and care-team data sharing.
                    </p>
                  </div>
                  <Icon
                    name="verified_user"
                    className="h-9 w-9 text-primary bg-primary/5 p-2 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                    <div className="flex items-center space-x-3">
                      <Icon name="lock" className="h-5 w-5 text-primary" />
                      <span className="font-medium">Data Encryption</span>
                    </div>
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDraftField('clinicSharingEnabled', !draft.clinicSharingEnabled)
                    }
                    className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name="share_reviews" className="h-5 w-5 text-primary" />
                      <span className="font-medium">Clinic Sharing</span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        draft.clinicSharingEnabled
                          ? 'bg-primary/10 text-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {draft.clinicSharingEnabled ? 'On' : 'Off'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                    <div className="flex items-center space-x-3">
                      <Icon name="history" className="h-5 w-5 text-primary" />
                      <span className="font-medium">Session History</span>
                    </div>
                    <Icon name="chevron_right" className="h-5 w-5 text-on-surface-variant" />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                    <div className="flex items-center space-x-3 text-error">
                      <Icon name="delete_forever" className="h-5 w-5" />
                      <span className="font-medium">Delete Medical History</span>
                    </div>
                    <Icon name="chevron_right" className="h-5 w-5 text-error" />
                  </div>
                </div>
              </Card>
              ) : null}

              {showDataLog ? (
                <Card variant="glass" className="p-6 sm:p-8 animate-slide-up [animation-delay:200ms]">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-bold font-display mb-1 text-on-surface">
                        Data Log
                      </h2>
                      <p className="text-sm text-on-surface-variant">
                        Your settings change history and preference snapshot.
                      </p>
                    </div>
                    <Icon name="history" className="h-9 w-9 text-primary bg-primary/5 p-2 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface-container-low p-4">
                      <p className="text-xs font-bold uppercase text-on-surface-variant mb-1">Last Save</p>
                      <p className="font-semibold">{savedOnText}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-4">
                      <p className="text-xs font-bold uppercase text-on-surface-variant mb-1">Current Locale</p>
                      <p className="font-semibold">{draft.interfaceLanguage}</p>
                    </div>
                  </div>
                </Card>
              ) : null}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-container-low p-5 sm:p-6 rounded-3xl border border-outline-variant/20 animate-slide-up [animation-delay:220ms]">
                <div>
                  <p className="text-sm text-on-surface-variant">Last saved: {savedOnText}</p>
                  {error ? <p className="text-sm text-error mt-1">{error}</p> : null}
                  {success ? <p className="text-sm text-primary mt-1">{success}</p> : null}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="tertiary"
                    className="flex-1 sm:flex-none"
                    type="button"
                    onClick={handleDiscardChanges}
                    disabled={!hasChanges || isSaving}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 sm:flex-none"
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={!hasChanges || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <PermanentChatbot />
    </>
  );
}
