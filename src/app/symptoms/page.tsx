import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function Symptoms() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Side: Editorial Introduction */}
          <section className="lg:col-span-5 flex flex-col gap-8">
            <div className="relative">
              <h1 className="font-display text-5xl font-extrabold text-on-surface leading-tight tracking-tight">
                Tell us how <br/><span className="text-black">you feel.</span>
              </h1>
              <div className="mt-6 text-on-surface-variant text-lg leading-relaxed max-w-md">
                Our clinical AI evaluates your symptoms against thousands of documented cases to provide accurate medical guidance and personalized relief.
              </div>
            </div>

            {/* Featured Visual Card */}
            <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-xl">
              <img 
                className="w-full h-full object-cover" 
                alt="Clinical laboratory" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkdhmH_5AJZoKyIfFh7VNOjdaxBVXJDFkqeReapCrIc9VECosp6bT1iIh0XiAoK31Znjr3mHUfkjwFOk4P6_bnszshnijydQZIucWF8dWkB1NgraDs3EMK5Pt9mTXfmDNiFBTgeGr1hu4RdS6JHwtXBkcOwfqGsTveMS_7Mh9wZ9qsm5aUScmMuwbETT5MhsuYMLNQDZKesTKEZ7_DLaJsfo75vCsT64h4wFvnw4FkVzl1FHy5DLsfNX_sxIKAbXLDoDPk3_T7kQeu"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1 font-label">Clinical Insight</div>
                <div className="text-xl font-display font-bold">Safe & Private Analysis</div>
              </div>
            </div>

            {/* Secondary Support */}
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <div>
                <div className="font-bold font-display text-on-surface">Privacy Guaranteed</div>
                <div className="text-sm text-on-surface-variant">Your health data is encrypted and anonymized.</div>
              </div>
            </div>
          </section>

          {/* Right Side: Symptom Input Bento/Flow */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            {/* Main Symptom Search Module */}
            <Card variant="glass" className="p-8">
              <label className="block text-on-surface-variant font-label text-sm font-semibold mb-3">Add your symptoms</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">search</span>
                </div>
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-300 text-lg font-medium text-on-surface placeholder:text-outline-variant outline-none" 
                  placeholder="e.g., Headache, Nausea, Muscle Pain..." 
                  type="text"
                />
              </div>

              {/* Selected Chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {['Headache', 'Fever', 'Fatigue'].map((symptom, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full font-medium text-sm animate-in fade-in transition-transform hover:scale-105 cursor-default">
                    {symptom} <span className="material-symbols-outlined text-sm cursor-pointer hover:text-primary">close</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Secondary Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration */}
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <span className="font-bold text-on-surface font-display">Duration</span>
                </div>
                <select className="w-full bg-surface-container-high border-none border-r-8 border-transparent rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest font-medium text-on-surface transition-all duration-300">
                  <option>Less than 24 hours</option>
                  <option>1-3 days</option>
                  <option>4-7 days</option>
                  <option>More than a week</option>
                  <option>Chronic (Months+)</option>
                </select>
              </Card>

              {/* Frequency */}
              <Card variant="glass" className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary">sync</span>
                  <span className="font-bold text-on-surface font-display">Frequency</span>
                </div>
                <select className="w-full bg-surface-container-high border-none border-r-8 border-transparent rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest font-medium text-on-surface transition-all duration-300">
                  <option>Constant</option>
                  <option>Intermittent</option>
                  <option>Only at night</option>
                  <option>Triggered by activity</option>
                </select>
              </Card>
            </div>

            {/* Severity Slider */}
            <Card variant="glass" className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">priority_high</span>
                  <span className="font-bold text-on-surface font-display">Severity Level</span>
                </div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold text-sm">Moderate (5/10)</span>
              </div>
              <input 
                className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary outline-none focus:outline-none" 
                max="10" min="1" type="range" defaultValue="5"
              />
              <div className="flex justify-between mt-3 text-xs font-bold text-outline-variant font-label uppercase tracking-tighter">
                <span>Mild</span>
                <span>Severe</span>
              </div>
            </Card>

            {/* CTA Module */}
            <div className="mt-4">
              <Button variant="primary" className="w-full py-6 text-xl flex items-center justify-center gap-3 group">
                Analyze Symptoms
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Button>
              <p className="text-center text-on-surface-variant text-sm mt-4 italic font-body">
                Results are AI-generated. Consult a doctor for critical conditions.
              </p>
            </div>
          </section>
        </div>
      </main>
      <PermanentChatbot />
    </>
  );
}
