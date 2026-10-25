'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { getAuthToken } from '../lib/auth';

const tools = [
  { icon: 'medical_services', title: 'Symptom checker', desc: 'Describe how you feel and organize the details that matter.', href: '/symptoms', tag: 'Understand symptoms' },
  { icon: 'medication', title: 'Medicine guidance', desc: 'Review available guidance, cautions, and safety information.', href: '/recommendations', tag: 'Explore guidance' },
  { icon: 'qr_code_scanner', title: 'Prescription scanner', desc: 'Turn a prescription image into a report you can review.', href: '/scanner', tag: 'Read a prescription' },
  { icon: 'monitoring', title: 'Medical history', desc: 'Keep your health records and scan history together.', href: '/medical-history', tag: 'Stay organized' },
];

export default function Home() {
  const router = useRouter();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const handleGetStarted = useCallback(() => {
    router.push(getAuthToken() ? '/symptoms' : '/login');
  }, [router]);

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-outline-variant/30 bg-[#f1f6f3]">
          <div aria-hidden="true" className="absolute -right-24 -top-32 h-[480px] w-[480px] rounded-full border border-primary/10" />
          <div aria-hidden="true" className="absolute -right-8 -top-16 h-[350px] w-[350px] rounded-full border border-primary/10" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-sm">
                <span className="h-2 w-2 rounded-full bg-secondary" /> A calmer way to navigate health information
              </div>
              <h1 className="font-display text-[2.65rem] font-extrabold leading-[1.1] tracking-[-0.045em] text-on-surface sm:text-5xl lg:text-[3.75rem]">
                Understand what you&apos;re feeling. <span className="text-primary">Know what to do next.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-on-surface-variant sm:text-lg sm:leading-8">
                Salvexa helps you organize symptoms, explore AI-assisted health guidance, and keep important medical information in one place.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={handleGetStarted}>Get started <Icon name="arrow_forward" className="h-4 w-4" /></Button>
                <Button size="lg" variant="secondary" onClick={() => setShowLearnMore(true)}>How it works</Button>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm text-on-surface-variant">
                <Icon name="verified_user" className="h-4 w-4 text-primary" />
                <span>Designed with safety and privacy in mind</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
              <div className="absolute -inset-5 rounded-[2rem] bg-primary/[.06] blur-2xl" />
              <Card className="relative overflow-hidden rounded-2xl border border-outline-variant/50 bg-white shadow-[0_24px_70px_-35px_rgba(15,58,53,.38)]">
                <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white"><Icon name="favorite" className="h-5 w-5" /></span>
                    <div><p className="text-sm font-bold">Your health workspace</p><p className="text-xs text-on-surface-variant">A clear place to begin</p></div>
                  </div>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 text-[11px] font-semibold text-on-secondary-container">Private</span>
                </div>
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="rounded-xl bg-surface px-4 py-3.5">
                    <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-on-surface-variant">START WITH HOW YOU FEEL</span><Icon name="edit" className="h-4 w-4 text-primary" /></div>
                    <p className="text-sm font-medium text-on-surface">Tell us about your symptoms</p>
                    <div className="mt-3 flex gap-2"><span className="rounded-full border border-primary/20 bg-white px-3 py-1 text-xs text-primary">Headache</span><span className="rounded-full border border-primary/20 bg-white px-3 py-1 text-xs text-primary">Fever</span><span className="rounded-full border border-dashed border-outline-variant px-3 py-1 text-xs text-on-surface-variant">+ Add</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/symptoms" className="group rounded-xl border border-outline-variant/40 p-4 hover:border-primary/40 hover:bg-[#f7fbf9]"><Icon name="medical_services" className="mb-3 h-5 w-5 text-primary" /><p className="text-sm font-bold">Symptom check</p><p className="mt-1 text-xs text-on-surface-variant">Share what&apos;s changed</p></Link>
                    <Link href="/scanner" className="group rounded-xl border border-outline-variant/40 p-4 hover:border-primary/40 hover:bg-[#f7fbf9]"><Icon name="qr_code_scanner" className="mb-3 h-5 w-5 text-primary" /><p className="text-sm font-bold">Scan a prescription</p><p className="mt-1 text-xs text-on-surface-variant">Review a saved report</p></Link>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-[#e8dccb] bg-[#fbf8f2] p-3.5">
                    <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-[#8a633b]" /><p className="text-xs leading-5 text-[#68563f]">Salvexa provides educational guidance. It does not replace advice from a qualified healthcare professional.</p>
                  </div>
                </div>
                <div className="border-t border-outline-variant/30 bg-white px-5 py-3 text-center text-[11px] text-on-surface-variant">A thoughtful starting point for your next health conversation</div>
              </Card>
              <div className="absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-xs font-semibold text-on-surface shadow-md sm:flex"><span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary-container text-secondary"><Icon name="health_and_safety" className="h-4 w-4" /></span> Safety information stays visible</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-primary">Your health, organized</p><h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Useful tools for every step</h2></div>
            <p className="max-w-md text-sm leading-6 text-on-surface-variant">Move from questions to clearer information with tools that work together around your existing health details.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool, i) => <Card key={tool.href} className="group p-5 sm:p-6">
              <div className="mb-8 flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eaf4f0] text-primary"><Icon name={tool.icon} className="h-5 w-5" /></span><span className="text-xs font-medium text-on-surface-variant">0{i + 1}</span></div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary">{tool.tag}</p><h3 className="font-display text-lg font-bold">{tool.title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-on-surface-variant">{tool.desc}</p>
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-on-surface hover:text-primary" href={tool.href}>Explore <Icon name="arrow_forward" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </Card>)}
          </div>
        </section>

        <section className="border-y border-outline-variant/30 bg-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:py-20">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-primary">A simple flow</p><h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">From concern to a clearer conversation.</h2><p className="mt-4 max-w-md text-sm leading-7 text-on-surface-variant">Keep the important details together, understand what the system returned, and share relevant information with a professional.</p></div>
            <div className="divide-y divide-outline-variant/40">
              {[['01','Describe your symptoms','Add the details and context that help explain how you feel.'],['02','Review available guidance','Explore the returned information, including any safety notices.'],['03','Choose your next step','Keep your history organized and contact a professional when needed.']].map(([n,t,d])=><div key={n} className="flex gap-5 py-5 first:pt-0 last:pb-0"><span className="font-display text-sm font-bold text-primary">{n}</span><div><h3 className="font-display font-bold">{t}</h3><p className="mt-1 text-sm leading-6 text-on-surface-variant">{d}</p></div></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex flex-col gap-5 rounded-2xl bg-[#eaf3ef] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-primary"><Icon name="health_and_safety" className="h-5 w-5" /></span><div><h2 className="font-display text-xl font-bold">Health guidance needs a human perspective.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">AI-assisted information can help you prepare, but it cannot diagnose or replace a clinician. Seek urgent care for severe or rapidly worsening symptoms.</p></div></div>
            <Link href="/privacy-policy" className="shrink-0 text-sm font-semibold text-primary hover:underline">Privacy & safety</Link>
          </div>
        </section>
      </main>

      {showLearnMore ? <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="learn-more-title">
        <button aria-label="Close dialog" className="absolute inset-0 cursor-default bg-on-surface/50" onClick={() => setShowLearnMore(false)} />
        <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-2xl sm:p-9">
          <div className="mb-6 flex items-center justify-between"><h2 id="learn-more-title" className="font-display text-2xl font-bold">How Salvexa works</h2><button type="button" aria-label="Close" onClick={() => setShowLearnMore(false)} className="rounded-lg p-2 hover:bg-surface"><Icon name="close" className="h-5 w-5" /></button></div>
          <div className="space-y-5 text-sm leading-7 text-on-surface-variant"><p>Salvexa brings symptom entry, AI-assisted medicine guidance, prescription scanning, and medical history into one place. Add the health context you choose to share, then review the information returned by the system.</p><p>Safety notices and warnings are shown alongside relevant guidance when provided. This service is educational and cannot provide a diagnosis or replace professional medical advice. Always consult a qualified healthcare professional before making treatment decisions.</p><p>Your account and health details are handled through the existing Salvexa application services. Visit the <Link className="font-semibold text-primary underline" href="/privacy-policy" onClick={() => setShowLearnMore(false)}>privacy policy</Link> for more information.</p></div>
          <div className="mt-8 flex justify-end"><Button onClick={() => setShowLearnMore(false)}>Got it</Button></div>
        </div>
      </div> : null}
    </>
  );
}
