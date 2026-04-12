import Link from 'next/link';
import { Button } from '../ui/Button';

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-black backdrop-blur-xl shadow-ambient">
      <nav className="flex justify-between items-center h-20 px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg font-black font-display" style={{ color: '#FFFFFF' }}>
            AI Medicine Rec
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="border-b-2 border-white pb-1 font-display tracking-tight font-semibold transition-all duration-300" style={{ color: '#FFFFFF' }}>
            Home
          </Link>
          <Link href="/symptoms" className="font-display tracking-tight font-semibold transition-all duration-300" style={{ color: '#FFFFFF' }}>
            Symptoms
          </Link>
          <Link href="/recommendations" className="font-display tracking-tight font-semibold transition-all duration-300" style={{ color: '#FFFFFF' }}>
            Recommendations
          </Link>
          <Link href="/scanner" className="font-display tracking-tight font-semibold transition-all duration-300" style={{ color: '#FFFFFF' }}>
            Prescription Scanner
          </Link>
          <Link href="/profile" className="font-display tracking-tight font-semibold transition-all duration-300" style={{ color: '#FFFFFF' }}>
            Medical History
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-transform active:scale-95">
            <span className="material-symbols-outlined" style={{ color: '#FFFFFF' }}>notifications</span>
          </button>
          <Link href="/login" className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-transform active:scale-95">
            <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
          </Link>
          <Button variant="danger" className="uppercase tracking-wider">
            Emergency
          </Button>
        </div>
      </nav>
    </header>
  );
}
