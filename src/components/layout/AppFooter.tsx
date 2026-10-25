import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant/40 bg-white">
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr] md:py-12">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-on-surface">
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-xs text-white">S</span>
            SALVEXA
          </Link>
          <p className="max-w-sm text-sm leading-6 text-on-surface-variant">
            Thoughtful tools to help you make sense of health information and prepare for a conversation with a healthcare professional.
          </p>
          <p className="text-xs text-on-surface-variant">© 2026 Salvexa. AI guidance is educational and is not a prescription.</p>
        </div>
        <div className="space-y-3">
          <h4 className="font-display text-sm font-bold text-on-surface">Your health</h4>
          <nav aria-label="Health tools" className="flex flex-col items-start gap-2 text-sm">
            <Link href="/symptoms" className="text-on-surface-variant hover:text-primary">Symptom checker</Link>
            <Link href="/scanner" className="text-on-surface-variant hover:text-primary">Prescription scanner</Link>
            <Link href="/medical-history" className="text-on-surface-variant hover:text-primary">Medical history</Link>
          </nav>
        </div>
        <div className="space-y-3">
          <h4 className="font-display text-sm font-bold text-on-surface">Safety & privacy</h4>
          <p className="text-sm leading-6 text-on-surface-variant">For severe symptoms, contact local emergency services or seek immediate care.</p>
          <nav aria-label="Legal" className="flex gap-4 text-sm">
            <Link href="/terms" className="font-medium text-primary hover:underline">Terms</Link>
            <Link href="/privacy-policy" className="font-medium text-primary hover:underline">Privacy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
