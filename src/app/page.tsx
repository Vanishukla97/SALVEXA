'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { getAuthToken } from '../lib/auth';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleGetStarted = useCallback(() => {
    const token = getAuthToken();
    if (token) {
      router.push('/symptoms');
    } else {
      router.push('/login');
    }
  }, [router]);
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-screen lg:min-h-[921px] flex items-center overflow-hidden bg-surface-container-low">
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
                <Icon name="verified_user" className="h-[18px] w-[18px]" />
                <span>Next-Generation Healthcare</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-display font-extrabold text-on-surface leading-[1.1] tracking-tight">
                AI-powered health assistance
              </h1>
              
              <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed font-medium">
                Personalized clinical intelligence at your fingertips. From symptom analysis to prescription management, we bring serenity to your medical journey.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Button variant="primary" size="lg" onClick={handleGetStarted}>Get Started</Button>
                <Button variant="secondary" size="lg" onClick={() => setShowLearnMore(true)}>Learn More</Button>
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
                  <Icon name="favorite" className="h-5 w-5 text-secondary" />
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
                { icon: 'medical_services', title: 'Symptom Checker', desc: 'Analyze your symptoms with our AI to understand potential conditions instantly.', color: 'primary', link: 'Check Now', href: '/symptoms' },
                { icon: 'medication', title: 'Medicine Guide', desc: 'Get intelligent recommendations and dosage guidelines tailored to your profile.', color: 'secondary', link: 'Explore', href: '/recommendations' },
                { icon: 'qr_code_scanner', title: 'Prescript Scanner', desc: 'Instantly digitize paper prescriptions to track refills and interactions.', color: 'tertiary', link: 'Scan Now', href: '/scanner' },
                { icon: 'monitoring', title: 'Profile Tracking', desc: 'Monitor your long-term health metrics and history in one secure dashboard.', color: 'primary', link: 'View History', href: '/medical-history' }
              ].map((module, i) => (
                <Card key={i} className="group p-8">
                  <div className={`w-14 h-14 bg-${module.color}/10 rounded-2xl flex items-center justify-center mb-6 text-${module.color} group-hover:bg-${module.color} group-hover:text-on-primary transition-colors`}>
                    <Icon name={module.icon} className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3">{module.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6">{module.desc}</p>
                  <Link className={`text-${module.color} font-bold inline-flex items-center gap-2 group-hover:gap-3 transition-all`} href={module.href}>
                    {module.link} <Icon name="arrow_forward" className="h-4 w-4" />
                  </Link>
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

      </main>

      {showLearnMore ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowLearnMore(false)} />
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6 sm:p-10 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-display font-extrabold text-on-surface">Learn More</h2>
              <button
                type="button"
                onClick={() => setShowLearnMore(false)}
                className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 text-on-surface">
              <section>
                <h3 className="text-2xl font-display font-bold text-primary mb-3">Your Health, Simplified</h3>
                <p className="leading-relaxed">
                  The AI-Based Medicine Recommendation System is designed to help users better understand their symptoms and explore possible medicine options in a simple and organized way. By combining your health information with symptom analysis, the platform provides personalized recommendations while keeping safety as a priority.
                </p>
              </section>

              <section>
                <h3 className="text-2xl font-display font-bold text-primary mb-3">How It Works</h3>
                <p className="mb-3">Getting started is simple:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Create your account and complete your health profile.</li>
                  <li>Tell us what symptoms you&apos;re experiencing.</li>
                  <li>Add details such as how long you&apos;ve had them and how severe they are.</li>
                  <li>The system analyzes your information and provides medicine recommendations along with important usage instructions and precautions.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-2xl font-display font-bold text-primary mb-3">Personalized for You</h3>
                <p className="mb-3">Everyone&apos;s health situation is different. That&apos;s why the system takes into account information such as:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Age and weight</li>
                  <li>Medical history</li>
                  <li>Current medications</li>
                  <li>Allergies</li>
                  <li>Previous surgeries</li>
                  <li>Special conditions such as pregnancy or breastfeeding</li>
                </ul>
                <p className="mt-3">This helps provide recommendations that are more relevant to your individual needs.</p>
              </section>

              <section>
                <h3 className="text-2xl font-display font-bold text-primary mb-3">Prescription Scanner</h3>
                <p className="mb-3">Have a prescription but finding it difficult to understand?</p>
                <p>Simply upload a prescription image and the system will extract the key information and present it in a clearer, more user-friendly format. It can help you understand prescribed medicines, dosage instructions, and other important details.</p>
              </section>

              <section>
                <h3 className="text-2xl font-display font-bold text-primary mb-3">Health Dashboard</h3>
                <p>Your health information stays organized in one place. The dashboard allows you to manage your profile, review medical history, and view health insights through easy-to-understand charts and visualizations.</p>
              </section>

              <section>
                <h3 className="text-2xl font-display font-bold text-primary mb-3">Built with Safety in Mind</h3>
                <p>Before displaying recommendations, the system checks for factors such as allergies, existing medications, and other health conditions. If any potential risks are detected, appropriate warnings and precautions are provided.</p>
              </section>

              <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="text-xl font-display font-bold text-amber-800 mb-3">Important Note</h3>
                <p className="text-amber-900 leading-relaxed">
                  This platform is intended to provide general health guidance and educational information. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. For serious symptoms or medical emergencies, always consult a qualified healthcare professional.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/20 flex justify-end">
              <Button variant="primary" onClick={() => setShowLearnMore(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
