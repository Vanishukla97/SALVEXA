import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function Recommendations() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold font-display text-on-surface tracking-tight mb-4">Medication Insights</h1>
              <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
                Based on your reported symptoms and health profile, we have analyzed the following therapeutic options. Review the safety profiles and dosages carefully.
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="flex gap-3">
                <Button variant="secondary" className="flex items-center gap-2 border-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-sm">history</span>
                  Save to History
                </Button>
                <Button variant="primary" className="flex items-center gap-2 text-on-primary font-semibold">
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export Report
                </Button>
              </div>
              <label className="inline-flex items-center cursor-pointer gap-3">
                <input className="sr-only peer" type="checkbox" />
                <div className="relative w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="text-sm font-medium text-on-surface-variant">Save automatically</span>
              </label>
            </div>
          </div>
        </header>

        {/* Main Content Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Safe Options (Green) */}
          <div className="md:col-span-8 flex flex-col gap-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-secondary rounded-full"></div>
              <h2 className="text-2xl font-bold font-display">Recommended Therapy</h2>
            </div>
            
            {/* Medicine Card 1 - High Relevance */}
            <Card variant="glass" className="p-8 border-l-8 border-secondary relative overflow-hidden group">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-48 h-48 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt="Pills" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5loq4P9VAVm1IXfnET-oHd0SgRuZNwkDDcR5zeaxHuNsTgRAOlKZMd74FbSRDP490DjY2lt_ijnFG_1uoIvGZhpEmdyauwkzD0qss3Ek4O7BkWlSAFAUo3YdiClt2wKfI21lF0otsVTPuaXWuTA-OMZqMdf1_pIrdoVsabuLpnuykQlw2F_Yz88yyTG_WOkHJA41N6upS8NaP-Egdp_bbIC_1z7zzT4ZDqFu3gNZ18okqzWtHILjiTl2603FYOeTrxEhTjd3O8k07"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-bold font-display text-on-surface mb-1">Amoxicillin</h3>
                      <p className="text-primary font-medium tracking-wide text-sm font-label">BRAND: AMOXIL</p>
                    </div>
                    <div className="bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-xs font-bold font-label uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      High Safety
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    {[
                      { icon: "medication", label: "Dosage", value: "500mg Capsule" },
                      { icon: "schedule", label: "Interval", value: "Every 8 Hours (3x Daily)" },
                      { icon: "restaurant", label: "Instructions", value: "Take after food" },
                      { icon: "info", label: "Course", value: "7-10 Days Completion" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary-container">{item.icon}</span>
                        <div>
                          <p className="text-xs text-on-surface-variant font-bold font-label uppercase tracking-tighter">{item.label}</p>
                          <p className="text-on-surface font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl">
                    <p className="text-xs text-on-surface-variant font-bold uppercase mb-2 font-label">Precautions</p>
                    <p className="text-sm text-on-surface leading-relaxed italic">
                      Finish the full course even if symptoms disappear. May cause mild nausea.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Medicine Card 2 */}
            <Card variant="glass" className="p-8 border-l-8 border-secondary relative overflow-hidden group">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-48 h-48 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt="Capsules" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBNcu4dsIh7NMYXiuaqg8ZjK0NykIIdNvFfr3GgFoDZI_vX_D97zlxudABL3RPZWKFjuolAW1EO0MLLHnfzPNiutJ4IdJpQ23XKm6NskbG_yoR7mBKZWwtfmDQEjdW85m3J96irOq4B7hFN5qfoAScpjIYCWophYiTDISUqfnhqy7gSAMK-UqmlwpZsrHAUfpimG6acbkx86amOOuclnVxnRo4jlZ-q5ykTVk_UYDt-2BiC7ZPq_4xTtB8phxrsJIDCtnJcoesfq4r"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-bold font-display text-on-surface mb-1">Cetirizine</h3>
                      <p className="text-primary font-medium tracking-wide text-sm font-label">BRAND: ZYRTEC</p>
                    </div>
                    <div className="bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-xs font-bold font-label uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Standard Safe
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { icon: "pill", label: "Dosage", value: "10mg Tablet" },
                      { icon: "history", label: "Interval", value: "Once Daily" },
                      { icon: "no_meals", label: "Instructions", value: "With or without food" },
                      { icon: "warning_amber", label: "Warning", value: "May cause drowsiness" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary-container">{item.icon}</span>
                        <div>
                          <p className="text-xs text-on-surface-variant font-bold font-label uppercase tracking-tighter">{item.label}</p>
                          <p className="text-on-surface font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Cards (Yellow & Red) */}
          <div className="md:col-span-4 flex flex-col gap-8">
            {/* Caution Section (Yellow) */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-tertiary-container rounded-full"></div>
                <h2 className="text-xl font-bold font-display">Cautionary Options</h2>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-tertiary-container/30 relative shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold font-display text-on-surface">Ibuprofen</h3>
                  <span className="bg-tertiary-fixed text-tertiary-container px-3 py-1 rounded-full text-[10px] font-black font-label uppercase tracking-widest">Caution</span>
                </div>
                <p className="text-xs text-primary mb-3 font-bold font-label tracking-widest">BRAND: ADVIL</p>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-label">Dosage</span>
                    <span className="font-semibold">400mg</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-label">Timing</span>
                    <span className="font-semibold">With Food ONLY</span>
                  </div>
                </div>
                <div className="p-3 bg-tertiary-fixed/30 rounded-xl border border-tertiary-fixed-dim/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-tertiary text-sm">error</span>
                    <span className="text-[10px] font-bold font-label uppercase text-tertiary">Precaution</span>
                  </div>
                  <p className="text-xs text-on-surface leading-tight font-body">
                    Avoid if you have a history of stomach ulcers or renal sensitivity.
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Section (Red) */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-error rounded-full"></div>
                <h2 className="text-xl font-bold font-display">Risk Contraindications</h2>
              </div>
              <div className="bg-error-container/20 p-6 rounded-2xl border border-error-container relative shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold font-display text-on-surface">Aspirin</h3>
                  <span className="bg-error text-on-error px-3 py-1 rounded-full text-[10px] font-black font-label uppercase tracking-widest">High Risk</span>
                </div>
                <p className="text-xs text-error mb-3 font-bold font-label tracking-widest">BRAND: BAYER</p>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-error">
                    <span className="material-symbols-outlined">block</span>
                    <span className="text-xs font-bold leading-tight font-label">POTENTIAL ADVERSE INTERACTION WITH PROFILE</span>
                  </div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl border border-error/10">
                  <p className="text-xs text-on-surface leading-tight font-body">
                    Recommended to avoid based on your stated allergy history. Consult a specialist before use.
                  </p>
                </div>
              </div>
            </div>

            {/* Helpful Tip Card */}
            <div className="bg-primary/5 p-8 rounded-2xl border-2 border-dashed border-primary/20">
              <span className="material-symbols-outlined text-primary mb-4" style={{ fontSize: "40px" }}>lightbulb</span>
              <h4 className="text-lg font-bold font-display text-primary mb-2">Smart Reminders</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Set up automated alerts for your medication schedule to ensure maximum efficacy of the prescribed course.
              </p>
            </div>
          </div>
        </div>
      </main>
      <PermanentChatbot />
    </>
  );
}
