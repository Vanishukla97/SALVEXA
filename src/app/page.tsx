import { Navbar } from '../components/layout/Navbar';
import { PermanentChatbot } from '../components/layout/PermanentChatbot';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[921px] flex items-center overflow-hidden bg-surface-container-low">
          <div className="absolute inset-0 z-0">
            <img 
              className="w-full h-full object-cover opacity-20 mix-blend-overlay" 
              alt="Medical background" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlRv-7gAP_KirBCs2Q3Acj_2Z66xvh7fMGTGEpgXfMIIZ1HtrFrajyZf25nB34ItQj-aFDqKv8GUi9BAT4QqJsUliEopGykRqvoiEH2MOIga7541OiQU4i4WBi7oeHvEypqNSc4eCPL1BrNUNIhjbbTtQYjCnXGZASyl2BX_PziVQ1EEOV9QeU3bcUtaRKmynZxdOMY3VUgVGstUooXE_I5zSTq0txC-iCA1rE3_mEjP5ReaJuDyxVNQYR2KsEDjmUBhCprSIvM1Aw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent"></div>
          </div>
          
          <div className="container mx-auto px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container/30 text-on-secondary-container font-semibold text-sm">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Next-Generation Healthcare</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-display font-extrabold text-on-surface leading-[1.1] tracking-tight">
                AI-powered health assistance
              </h1>
              
              <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed font-medium">
                Personalized clinical intelligence at your fingertips. From symptom analysis to prescription management, we bring serenity to your medical journey.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Button variant="primary" size="lg">Get Started</Button>
                <Button variant="secondary" size="lg">Learn More</Button>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-surface-container-lowest transform rotate-2">
                <img 
                  className="w-full h-auto" 
                  alt="Doctor with tablet" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2aDNgTKQoyvYc9YM8Ejw9P5jhbLpJJgzjjKDXeMT3qkyuoegsP8B78OvqlSKErLKBZgiAa-pb9j_z5VMALY68rLRojVMufJZKeR1EEE_tjT-9fNVSJzFx0z2hCqSPgzhVhbIPSgTOtyigVs7GQXq3hTyAO7PSghpZRoP3QfOrCiURGjbX1gDsSit8SQWwa7ELEXXg2hKdY5u2WXQm2S1KcZLe4Cj8SvYvImz50fR3arB2_qIl19CVRtswKqcFV3xXRL09FENtsByZ"
                />
              </div>
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
              
              {/* Floating Stat Card */}
              <div className="absolute bottom-12 -left-8 z-20 bg-surface-container-lowest/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-outline-variant/10 max-w-[240px]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  <span className="font-display font-bold text-on-surface">Vitality Score</span>
                </div>
                <div className="h-12 w-full flex items-end gap-1 px-1">
                  <div className="bg-secondary/40 w-full h-[40%] rounded-t-sm"></div>
                  <div className="bg-secondary/40 w-full h-[60%] rounded-t-sm"></div>
                  <div className="bg-secondary/40 w-full h-[55%] rounded-t-sm"></div>
                  <div className="bg-secondary/40 w-full h-[85%] rounded-t-sm"></div>
                  <div className="bg-secondary/40 w-full h-[70%] rounded-t-sm"></div>
                  <div className="bg-secondary/40 w-full h-[95%] rounded-t-sm"></div>
                  <div className="bg-secondary w-full h-[75%] rounded-t-sm"></div>
                </div>
                <p className="text-xs text-on-surface-variant mt-2 font-medium">98% precision in health tracking</p>
              </div>
            </div>
          </div>
        </section>

        {/* Comprehensive Care Modules */}
        <section className="py-24 bg-surface px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center max-w-2xl mx-auto">
              <h2 className="text-4xl font-display font-bold text-on-surface mb-4">Comprehensive Care Modules</h2>
              <p className="text-on-surface-variant font-medium">Our intelligent suite of tools is designed to provide a holistic view of your health with clinical-grade accuracy.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: 'medical_services', title: 'Symptom Checker', desc: 'Analyze your symptoms with our AI to understand potential conditions instantly.', color: 'primary', link: 'Check Now' },
                { icon: 'medication', title: 'Medicine Guide', desc: 'Get intelligent recommendations and dosage guidelines tailored to your profile.', color: 'secondary', link: 'Explore' },
                { icon: 'qr_code_scanner', title: 'Prescript Scanner', desc: 'Instantly digitize paper prescriptions to track refills and interactions.', color: 'tertiary', link: 'Scan Now' },
                { icon: 'monitoring', title: 'Profile Tracking', desc: 'Monitor your long-term health metrics and history in one secure dashboard.', color: 'primary', link: 'View History' }
              ].map((module, i) => (
                <Card key={i} className="group p-8">
                  <div className={`w-14 h-14 bg-${module.color}/10 rounded-2xl flex items-center justify-center mb-6 text-${module.color} group-hover:bg-${module.color} group-hover:text-on-primary transition-colors`}>
                    <span className="material-symbols-outlined text-3xl">{module.icon}</span>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3">{module.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6">{module.desc}</p>
                  <a className={`text-${module.color} font-bold inline-flex items-center gap-2 group-hover:gap-3 transition-all`} href="#">
                    {module.link} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Simple Path to Clarity */}
        <section className="py-24 bg-surface-container-low px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-display font-bold text-on-surface mb-6">Simple Path to Clarity</h2>
                <p className="text-on-surface-variant mb-12 font-medium max-w-lg">We&apos;ve refined the healthcare process down to three effortless steps, allowing you to focus on recovery rather than logistics.</p>
                <div className="space-y-8">
                  {[
                    { step: '1', title: 'Input Symptoms', desc: 'Briefly describe how you feel using natural language or select from our visual catalog.' },
                    { step: '2', title: 'AI Analysis', desc: 'Our medical engine cross-references millions of data points to provide precise insight.' },
                    { step: '3', title: 'Get Recommendation', desc: 'Receive a personalized care plan, medicine advice, and next steps for your wellness.' }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-display font-black">{s.step}</div>
                      <div>
                        <h4 className="text-xl font-display font-bold mb-1">{s.title}</h4>
                        <p className="text-on-surface-variant text-sm">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <img className="rounded-[3rem] shadow-2xl relative z-10" alt="App Preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBE5qJsWM3VVgpHVwQPV7d0JNYT8v6cAbpFxtUxcfUXN35JMCjAK7Dkrh6YvTo_hIdnD4YuzMxpyB4njYQMydl9C3h20r1ta3-TYM8PNyM-SATzG-yVWRJjVrNdjgKG7Qc1e_-MtVZIg_FDx9k_pBokB1Q4WI2HCz9WnEx7_n5h6lY3s3X321o-8fLdIEJzub3pMAkKjRvJOnr-TV3SRJc2Ft0f0-gZ0lgaEMYThbX3SHTsgf5W-Xr_JzBtxylJRXS_eBsJup3psT8u"/>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary-container rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary-container rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer implementation */}
        <footer className="bg-surface-container-high w-full rounded-t-[2rem] mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto px-12 py-16">
            <div className="space-y-6">
              <h3 className="text-2xl font-display font-black text-primary">AI Medicine Rec</h3>
              <p className="text-on-surface-variant font-body text-sm leading-relaxed">
                © 2026 AI-Based Medicine Recommendation System. All medical data is AI-generated for informational purposes.
              </p>
            </div>
          </div>
        </footer>
      </main>
      <PermanentChatbot />
    </>
  );
}
