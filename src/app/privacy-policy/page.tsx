'use client';

import Link from 'next/link';
import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-4 md:px-6 max-w-5xl mx-auto min-h-screen">
        <section className="rounded-3xl bg-surface-container-lowest border border-outline-variant/25 p-6 md:p-10 shadow-ambient">
          <p className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
            Effective Date: May 16, 2026
          </p>
          <h1 className="mt-4 text-4xl font-display font-extrabold text-on-surface">Privacy Policy</h1>
          <p className="mt-3 text-on-surface-variant">
            This Privacy Policy explains how Salvexa (AI Medicine Rec) collects, uses, stores, and protects your personal and health-related information when you use this platform.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-on-surface">
            <section>
              <h2 className="font-display font-bold text-xl">1. Information We Collect</h2>
              <p>
                We may collect account details (such as name, email, and password hash), profile data (such as age, gender, height, weight, allergies, and medical history), symptom inputs, recommendation records, uploaded prescription files, OCR-extracted text, and technical usage data (such as logs, IP address, device/browser metadata, and session identifiers).
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">2. How We Use Your Information</h2>
              <p>
                We use your data to provide and improve platform services, perform symptom analysis and safety checks, generate recommendation outputs, maintain account access and security, prevent abuse, debug platform issues, and comply with legal obligations.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">3. Legal Basis and Consent</h2>
              <p>
                We process your information based on your consent, the need to provide requested services, our legitimate interests in operating and securing the platform, and legal compliance requirements.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">4. Health Data and Medical Disclaimer</h2>
              <p>
                Health-related information is sensitive. Platform outputs are informational only and are not a medical diagnosis or prescription. For urgent or severe symptoms, immediately consult a licensed doctor or emergency hospital.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">5. Data Sharing and Third Parties</h2>
              <p>
                We do not sell personal data. We may share information with trusted service providers (for example hosting, database, OCR, or AI-processing providers) solely for service delivery and under confidentiality and security obligations. We may also disclose data where required by law or lawful government request.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">6. Data Retention</h2>
              <p>
                We retain your information only as long as necessary for service delivery, legal compliance, dispute resolution, and security purposes. Retention periods may vary by data type and applicable legal requirements.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">7. Security Measures</h2>
              <p>
                We use reasonable technical and organizational safeguards, including password hashing, access controls, and protected session handling. However, no digital system can guarantee absolute security, and you use the platform at your own risk.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">8. Your Rights</h2>
              <p>
                Subject to applicable law, you may request access, correction, deletion, or export of your personal data, and may withdraw consent where processing depends on consent. Certain legal or safety obligations may limit immediate deletion.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">9. Children’s Privacy</h2>
              <p>
                This platform is not intended for unsupervised use by children. If required by applicable law, use by minors must be supervised and authorized by a parent or legal guardian.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">10. International Data Processing</h2>
              <p>
                Depending on infrastructure and providers, your information may be processed in locations outside your state or country. Appropriate safeguards are applied where required by applicable law.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">11. Cookies and Session Technologies</h2>
              <p>
                We may use cookies and similar technologies for authentication, session continuity, security, and service functionality. Disabling such technologies may affect platform performance or access.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">12. Policy Changes</h2>
              <p>
                We may update this Privacy Policy from time to time. Updated versions become effective on publication. Continued use after updates constitutes acceptance of the revised policy, and re-consent may be requested for material changes.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-xl">13. Contact</h2>
              <p>
                For privacy questions or requests, contact the platform support/legal team through the contact channels provided in the application.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-outline-variant/25 text-sm text-on-surface-variant">
            Please also review our{' '}
            <Link href="/terms" className="text-primary font-semibold hover:underline">
              Terms & Conditions
            </Link>
            .
          </div>
        </section>
      </main>
      <PermanentChatbot />
    </>
  );
}

