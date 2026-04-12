import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function Settings() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto min-h-screen">
        {/* Header Section */}
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold font-display tracking-tight text-on-surface mb-2">Settings</h1>
          <p className="text-on-surface-variant text-lg">Manage your clinical preferences and account security.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-2">
            {[
              { icon: 'settings', label: 'General', active: true },
              { icon: 'security', label: 'Security', active: false },
              { icon: 'notifications', label: 'Alerts', active: false },
              { icon: 'description', label: 'Data Log', active: false }
            ].map((item, i) => (
              <button 
                key={i}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  item.active 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          {/* Main Settings Content */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Language Section */}
            <Card variant="glass" className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold font-display mb-1 text-on-surface">Language & Region</h2>
                  <p className="text-sm text-on-surface-variant font-body">Adjust your interface language and localization settings.</p>
                </div>
                <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">language</span>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-semibold font-label text-on-surface-variant ml-1">Interface Language</label>
                <div className="relative">
                  <select className="w-full bg-surface-container-high border-none border-r-8 border-transparent rounded-xl py-4 px-5 outline-none appearance-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium transition-all duration-300">
                    <option>English (United States)</option>
                    <option>Spanish (ES)</option>
                    <option>French (FR)</option>
                    <option>German (DE)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notifications Section */}
            <Card variant="glass" className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold font-display mb-1 text-on-surface">Notification Preferences</h2>
                  <p className="text-sm text-on-surface-variant font-body">Choose how you receive health alerts and system updates.</p>
                </div>
                <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">notifications_active</span>
              </div>
              <div className="space-y-6">
                {[
                  { title: "Medication Reminders", desc: "Daily alerts for scheduled prescription dosages.", active: true },
                  { title: "Symptom Tracking Alerts", desc: "Prompt to log symptoms after a high-risk recommendation.", active: true },
                  { title: "Health Reports", desc: "Weekly AI-generated summary of your medical data.", active: false }
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <h3 className="font-semibold text-on-surface">{notif.title}</h3>
                      <p className="text-sm text-on-surface-variant font-body">{notif.desc}</p>
                    </div>
                    <button className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${notif.active ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${notif.active ? 'ml-auto' : ''}`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Privacy Section */}
            <Card variant="glass" className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold font-display mb-1 text-on-surface">Privacy & Security</h2>
                  <p className="text-sm text-on-surface-variant font-body">Manage your data encryption and clinical sharing permissions.</p>
                </div>
                <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">verified_user</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all">
                  <div className="flex items-center space-x-3 text-on-surface">
                    <span className="material-symbols-outlined text-primary">lock</span>
                    <span className="font-medium">Data Encryption</span>
                  </div>
                  <span className="text-xs font-bold font-label text-secondary bg-secondary/10 px-2 py-1 rounded-full uppercase tracking-wider">Active</span>
                </button>
                <button className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all">
                  <div className="flex items-center space-x-3 text-on-surface">
                    <span className="material-symbols-outlined text-primary">share_reviews</span>
                    <span className="font-medium">Clinic Sharing</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>
                <button className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all">
                  <div className="flex items-center space-x-3 text-on-surface">
                    <span className="material-symbols-outlined text-primary">history</span>
                    <span className="font-medium">Session History</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>
                <button className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all group">
                  <div className="flex items-center space-x-3 text-error group-hover:text-error">
                    <span className="material-symbols-outlined">delete_forever</span>
                    <span className="font-medium">Delete Medical History</span>
                  </div>
                  <span className="material-symbols-outlined text-error opacity-70 group-hover:opacity-100 transition-opacity">chevron_right</span>
                </button>
              </div>
            </Card>

            {/* Save Changes Footer (Action Bar) */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-surface-container-low p-6 rounded-3xl">
              <p className="text-sm text-on-surface-variant mb-4 sm:mb-0 font-body">Last updated on Oct 24, 2026</p>
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <Button variant="tertiary" className="flex-1 sm:flex-none">Discard Changes</Button>
                <Button variant="primary" className="flex-1 sm:flex-none">Save Preferences</Button>
              </div>
            </div>

          </div>
        </div>
      </main>
      <PermanentChatbot />
    </>
  );
}
