import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Card } from '../../components/ui/Card';

export default function Profile() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Hero Profile Section */}
        <section className="mb-12 relative overflow-hidden rounded-[2rem] bg-surface-container-low p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-surface-container-highest">
                <img 
                  alt="Profile picture" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwOMwFBrgQOEWVdbUnyk4PMHGGe27kwuc2OO7ggDZ7hvYrUYybF88zr3urYQZX-8bUy4T3ukasoIRGSRFqW60AknLtkC6MLOOmTBwPKc2XgNXwQII3p90E9_pFy5heQVdvzPqTvuTwwFnFUTlfxdC4ozUw2F9i9EdkhV5IqzRTt5tZzicoBP_WWcJXzocQkhtML9GxalK547PNleYOWygHA2Erz_M1gdJf-OQ2HLdrfFkJS6hHV1bQz0cDBWZFrT9IQPVCpGoKVRIr"
                />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-hero-gradient text-white rounded-full shadow-lg hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold font-display text-on-surface tracking-tight mb-2">Sarah Jenkins</h1>
              <p className="text-on-surface-variant flex items-center justify-center md:justify-start gap-2">
                <span className="material-symbols-outlined text-teal-600">verified_user</span>
                Verified Health Profile • ID: MED-88291
              </p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm border border-outline-variant/10">
                  <span className="block text-xs font-bold text-primary uppercase tracking-wider">Blood Type</span>
                  <span className="text-xl font-bold font-display">A+ Positive</span>
                </div>
                <div className="bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm border border-outline-variant/10">
                  <span className="block text-xs font-bold text-primary uppercase tracking-wider">Height</span>
                  <span className="text-xl font-bold font-display">172 cm</span>
                </div>
                <div className="bg-surface-container-lowest px-4 py-2 rounded-lg shadow-sm border border-outline-variant/10">
                  <span className="block text-xs font-bold text-primary uppercase tracking-wider">Weight</span>
                  <span className="text-xl font-bold font-display">64 kg</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-hero-gradient opacity-5 blur-3xl"></div>
        </section>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Info (Card 1) */}
          <div className="lg:col-span-1 space-y-8">
            <Card variant="glass" className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold font-display flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">person</span>
                  Personal Info
                </h3>
                <button className="text-primary hover:bg-surface-container-low p-2 rounded-lg transition-colors">
                  <span className="material-symbols-outlined">edit_square</span>
                </button>
              </div>
              <div className="space-y-6">
                {[
                  { label: "Age", value: "34 Years Old" },
                  { label: "Gender", value: "Female" },
                  { label: "Date of Birth", value: "May 14, 1990" },
                  { label: "Primary Language", value: "English (US)" },
                  { label: "Occupation", value: "Architectural Designer" }
                ].map((item, i) => (
                  <div key={i}>
                    <label className="text-xs font-bold font-label text-on-surface-variant uppercase tracking-widest block mb-1">{item.label}</label>
                    <p className="text-lg font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Medical Activity */}
            <Card variant="glass" className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold font-display flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">update</span>
                  Recent Activity
                </h3>
                <a className="text-primary hover:underline text-sm font-bold" href="#">View All</a>
              </div>
              <div className="space-y-4">
                {[
                  { icon: "check_circle", title: "Frequent Dry Cough", date: "Oct 24, 2026" },
                  { icon: "pending", title: "Seasonal Hay Fever", date: "Oct 12, 2026" },
                  { icon: "check_circle", title: "Inhaler Refill Request", date: "Sep 28, 2026" }
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-lg border border-transparent hover:border-outline-variant/30 transition-all cursor-pointer">
                    <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full shrink-0">
                      <span className="material-symbols-outlined text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{activity.title}</p>
                      <p className="text-xs text-on-surface-variant">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Medical History & Medications (Card 2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Medical History Section */}
            <Card variant="glass" className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold font-display flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">history_edu</span>
                  Medical History
                </h3>
                <button className="text-primary hover:bg-surface-container-low p-2 rounded-lg transition-colors">
                  <span className="material-symbols-outlined">edit_square</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Asthma", desc: "Diagnosed 2012. Managed with occasional inhaler use. Periodic checkups every 6 months.", tag: "Chronic", bColor: "border-primary" },
                  { title: "Lactose Intolerance", desc: "Dietary management. Severe reaction to dairy proteins. Uses alternative enzyme supplements.", tag: "Dietary", bColor: "border-secondary" },
                  { title: "Appendectomy", desc: "Surgical procedure performed in June 2018. Fully recovered without complications.", tag: "Past Surgery", bColor: "border-primary/50" },
                  { title: "Seasonal Allergies", desc: "Strong reaction to cedar and oak pollen during spring months. Requires daily antihistamines.", tag: "Environmental", bColor: "border-error/30" }
                ].map((history, i) => (
                  <div key={i} className={`p-6 rounded-lg bg-surface-container-low border-l-4 ${history.bColor}`}>
                    <h4 className="font-bold text-primary font-display mb-2">{history.title}</h4>
                    <p className="text-sm text-on-surface-variant mb-3">{history.desc}</p>
                    <span className="inline-block px-2 py-1 bg-surface-container-lowest text-[10px] font-bold font-label uppercase rounded border border-outline-variant/30 text-primary">{history.tag}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Current Medications Section */}
            <Card variant="glass" className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold font-display flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">pill</span>
                  Current Medications
                </h3>
                <button className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add New
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { icon: "medication", title: "Albuterol Inhaler", desc: "90 mcg — As needed for shortness of breath", status: "3 Remaining", color: "text-primary" },
                  { icon: "medication_liquid", title: "Loratadine", desc: "10 mg Oral Tablet — Once daily in the morning", status: "Auto-Renew", color: "text-secondary" },
                  { icon: "vaccines", title: "Vitamin D3", desc: "2000 IU — Daily supplement for wellness", status: "Over-the-counter", color: "text-primary/70" }
                ].map((med, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 rounded-xl hover:bg-surface-container-low transition-colors group">
                    <div className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-full">
                      <span className="material-symbols-outlined">{med.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold font-display text-on-surface">{med.title}</h4>
                      <p className="text-sm text-on-surface-variant">{med.desc}</p>
                    </div>
                    <div className="hidden md:block text-right">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Refills</p>
                      <p className={`font-bold ${med.color}`}>{med.status}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-primary transition-all">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Vitality Chart Signature Component */}
        <section className="mt-12">
          <div className="bg-surface-container-low rounded-xl p-8">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
              <div>
                <h3 className="text-2xl font-bold font-display text-on-surface mb-2">Health Pulse</h3>
                <p className="text-on-surface-variant">Automated analysis of your recent activity metrics.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-xl min-w-[200px] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">Heart Rate</span>
                    <span className="text-secondary font-bold text-sm">+2%</span>
                  </div>
                  <div className="text-3xl font-black font-display text-on-surface mb-4">72 <span className="text-sm font-medium text-on-surface-variant">BPM</span></div>
                  <div className="h-8 flex items-end gap-1">
                    {[20, 60, 40, 60, 100, 30, 80].map((h, i) => (
                      <div key={i} className="w-full bg-secondary rounded-t-sm" style={{ height: `${h}%`, opacity: h / 100 }}></div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-surface-container-lowest p-6 rounded-xl min-w-[200px] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">Glucose</span>
                    <span className="text-primary font-bold text-sm">Stable</span>
                  </div>
                  <div className="text-3xl font-black font-display text-on-surface mb-4">94 <span className="text-sm font-medium text-on-surface-variant">mg/dL</span></div>
                  <div className="h-8 flex items-end gap-1">
                    {[60, 50, 60, 70, 50, 60, 60].map((h, i) => (
                      <div key={i} className="w-full bg-primary rounded-t-sm" style={{ height: `${h}%`, opacity: h / 100 + 0.1 }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PermanentChatbot />
    </>
  );
}
