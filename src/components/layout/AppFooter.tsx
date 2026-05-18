import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="bg-surface-container-high w-full rounded-t-[2rem] mt-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <h3 className="text-2xl font-display font-black text-primary">AI Medicine Rec</h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            © 2026 AI-Based Medicine Recommendation System. AI guidance is informational and not a prescription.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-display font-bold text-on-surface">Safety</h4>
          <p className="text-on-surface-variant text-sm">
            For severe symptoms, seek immediate consultation from the nearest doctor or hospital.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-display font-bold text-on-surface">Legal</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/terms" className="text-sm text-primary font-semibold hover:underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="text-sm text-primary font-semibold hover:underline">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
