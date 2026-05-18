'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Button } from '../../components/ui/Button';
import { getApiBaseUrl, getAuthToken } from '../../lib/auth';
import { CURRENT_TERMS_VERSION } from '../../lib/terms';

export default function TermsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const consentMode = searchParams.get('consent') === '1';
  const redirectTo = useMemo(() => searchParams.get('redirect') || '/profile', [searchParams]);

  const handleConsentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const token = getAuthToken();
    if (!token) {
      setError('Please login first to accept latest terms.');
      router.push('/login');
      return;
    }
    if (!accepted) {
      setError('Please accept Terms & Conditions and Medical Disclaimer to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/accept-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          termsVersion: CURRENT_TERMS_VERSION,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Unable to accept terms');
      }
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept terms');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-4 md:px-6 max-w-5xl mx-auto min-h-screen">
        <section className="rounded-3xl bg-surface-container-lowest border border-outline-variant/25 p-6 md:p-10 shadow-ambient">
          <p className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
            Terms Version {CURRENT_TERMS_VERSION}
          </p>
          <h1 className="mt-4 text-4xl font-display font-extrabold text-on-surface">Terms & Conditions</h1>
          <p className="mt-3 text-on-surface-variant">
            These Terms and Conditions govern your access to and use of this platform. Please read them carefully before using the services.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-on-surface">
            <section>
              <h2 className="font-display font-bold text-xl">1. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using this platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions and the Medical Disclaimer.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">2. Eligibility and Account Responsibility</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate, complete, and current information at all times.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">3. Informational Purpose Only</h2>
              <p>
                The platform provides AI-assisted health information for educational and informational purposes only. It does not provide medical advice, diagnosis, or treatment and does not replace consultation with a licensed medical professional.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">4. No Doctor-Patient Relationship</h2>
              <p>
                Use of this platform does not create a doctor-patient, hospital-patient, pharmacist-patient, or any other healthcare provider relationship between you and the platform, its owners, developers, or affiliates.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">5. Emergency and High-Risk Symptoms</h2>
              <p>
                If you experience emergency symptoms, including but not limited to chest pain, breathing difficulty, severe bleeding, loss of consciousness, stroke-like symptoms, or suspected heart attack, seek immediate emergency medical care. Do not rely on the platform for emergency decisions.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">6. User Data and Input Accuracy</h2>
              <p>
                You are solely responsible for the accuracy of symptoms, profile details, medications, allergies, and documents you submit. Inaccurate, incomplete, or outdated information may result in incorrect or unsafe outputs.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">7. Medication and Safety Disclaimer</h2>
              <p>
                Any medicine-related output, dosage suggestion, warning, or interaction notice is non-binding guidance only. You must obtain advice from a licensed physician or pharmacist before starting, stopping, or changing any medication.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">8. AI Limitations</h2>
              <p>
                AI-generated results may be incomplete, inaccurate, delayed, or unsuitable for your specific medical condition. The platform makes no guarantee of clinical correctness, fitness for a particular purpose, or medical outcome.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">9. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by applicable law, the platform and its operators shall not be liable for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages arising from your use of or reliance on platform content.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless the platform, its owners, team members, and affiliates from any claims, losses, liabilities, damages, and expenses arising out of your misuse of the platform or violation of these Terms.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">11. Privacy and Data Handling</h2>
              <p>
                Health-related data may be processed and stored for service delivery, safety checks, account operations, and product improvement. By using the platform, you consent to such processing in accordance with applicable privacy laws and platform policies.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">12. Suspension or Termination</h2>
              <p>
                The platform may suspend, restrict, or terminate access at any time for security, legal compliance, abuse prevention, or breach of these Terms, with or without prior notice where permitted by law.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">13. Changes to Terms</h2>
              <p>
                The platform may revise these Terms from time to time. Updated versions become effective on publication. Continued use after an update constitutes acceptance of the revised Terms. Re-consent may be required at login for material changes.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">14. Governing Law</h2>
              <p>
                These Terms shall be governed by and interpreted in accordance with applicable law. Any disputes shall be subject to the jurisdiction of competent courts, unless otherwise required by mandatory consumer protection laws.
              </p>
            </section>
          </div>

          {consentMode ? (
            <form className="mt-8 rounded-2xl bg-surface-container-low p-5 border border-outline-variant/20" onSubmit={handleConsentSubmit}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span className="text-sm text-on-surface">
                  I agree to Terms & Conditions and Medical Disclaimer (Version {CURRENT_TERMS_VERSION}).
                </span>
              </label>

              {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'I Agree & Continue'}
                </Button>
                <Link href="/login" className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          ) : null}
        </section>
      </main>
      <PermanentChatbot />
    </>
  );
}
