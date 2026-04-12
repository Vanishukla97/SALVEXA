import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function Scanner() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Hero Section */}
        <section className="mb-16 text-center md:text-left">
          <h1 className="font-display text-5xl font-extrabold text-on-surface tracking-tight mb-4 max-w-3xl">
            Smart Prescription <span className="text-primary">Analysis</span>
          </h1>
          <p className="font-body text-on-surface-variant text-lg max-w-2xl">
            Upload your medical prescription for instant extraction of medication details, potential diagnoses, and expert-vetted alternatives.
          </p>
        </section>

        {/* Bento Layout for Scanner Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Upload & Preview Column */}
          <div className="lg:col-span-5 space-y-8">
            {/* Guided Step 1 */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">1</div>
              <h2 className="font-display text-xl font-bold">Upload Document</h2>
            </div>
            
            {/* Drag & Drop Box */}
            <div className="relative group bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant hover:border-primary transition-all duration-500 p-12 text-center cursor-pointer overflow-hidden">
              <input className="absolute inset-0 opacity-0 cursor-pointer z-10" type="file" />
              <div className="relative z-0">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-primary text-4xl">upload_file</span>
                </div>
                <p className="font-display font-bold text-lg mb-2 text-on-surface">Drop your prescription here</p>
                <p className="text-on-surface-variant text-sm px-4">Supports PNG, JPG, or PDF. Ensure the text is clear for better accuracy.</p>
              </div>
            </div>

            {/* Preview Area (Simulated active state) */}
            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-label text-on-surface-variant uppercase tracking-widest">Document Preview</span>
                <button className="text-error text-sm font-medium hover:underline">Remove</button>
              </div>
              <div className="aspect-[3/4] bg-surface-container-high rounded-2xl overflow-hidden relative">
                <img 
                  alt="Medical document" 
                  className="w-full h-full object-cover opacity-60 grayscale-[0.5]" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjgYrItnbnGes445Frsw9f5hMxqw2eyZzUcCalp8T0zPOYLLsGypGDFAuMP6vrj7_UNSv5bDFQsdXfNnwh5V1Ymp18VzEGUjcqHgFXz_sH7QXxkdevEzrFl-716ITb2yTHruTwymThXmxGp-5o4phVce3_NNnGgkPwWRYuemUWcxCj7hxVPtxblY3FdDgv9cJtSIVipupSC9zBlud8YSSA73TlZWIHhC1QWNwJ-pUfcpfecHC4sZiZXkxvXKCaIG7wYZl4UNRzeCkf"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px]">
                  <div className="w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin mb-4"></div>
                  <span className="font-display font-bold text-white shadow-ambient">Scanning OCR Data...</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Analysis & Results Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* Guided Step 2 */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">2</div>
              <h2 className="font-display text-xl font-bold">Analysis Results</h2>
            </div>
            
            <div className="space-y-6">
              {/* Extracted Data Card */}
              <Card variant="glass" className="p-8 border border-outline-variant/15">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="font-display text-2xl font-extrabold mb-1 text-on-surface">Prescription Details</h3>
                    <p className="text-on-surface-variant text-sm">Extracted on Oct 24, 2026 • Scan ID: #RX-9921</p>
                  </div>
                  <span className="px-4 py-1 bg-secondary/10 text-secondary text-xs font-bold font-label rounded-full">AI VERIFIED</span>
                </div>

                {/* Potential Disease */}
                <div className="mb-8 p-6 bg-surface-container-high/50 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-tertiary">diagnosis</span>
                    <span className="text-xs font-bold font-label text-tertiary uppercase tracking-wider">Likely Indication</span>
                  </div>
                  <p className="font-display text-xl font-bold text-on-surface">Seasonal Allergic Rhinitis</p>
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed font-body">
                    The medication pattern strongly suggests a treatment for severe hay fever or chronic sinus inflammation.
                  </p>
                </div>

                {/* Medicines List */}
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">pill</span>
                    Identified Medicines
                  </h4>
                  
                  {/* Med Item 1 */}
                  <div className="group p-5 bg-surface-container-lowest rounded-2xl border border-transparent hover:border-primary/20 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold font-display text-lg text-on-surface">Amoxicillin 500mg</h5>
                      <span className="text-primary font-bold text-sm">Twice Daily</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-bold font-label uppercase">Antibiotic</span>
                      <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-bold font-label uppercase">7 Day Course</span>
                    </div>
                    <div className="pt-4 border-t border-outline-variant/10">
                      <p className="text-xs font-bold font-label text-on-surface-variant mb-2 uppercase">SUGGESTED ALTERNATIVES</p>
                      <div className="flex gap-4">
                        <div className="text-sm font-medium text-secondary">Augmentin (Generic)</div>
                        <div className="text-sm font-medium text-secondary">Cephalexin</div>
                      </div>
                    </div>
                  </div>

                  {/* Med Item 2 */}
                  <div className="group p-5 bg-surface-container-lowest rounded-2xl border border-transparent hover:border-primary/20 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold font-display text-lg text-on-surface">Cetirizine 10mg</h5>
                      <span className="text-primary font-bold text-sm">Once at Night</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-bold font-label uppercase">Antihistamine</span>
                    </div>
                    <div className="pt-4 border-t border-outline-variant/10">
                      <p className="text-xs font-bold font-label text-on-surface-variant mb-2 uppercase">SUGGESTED ALTERNATIVES</p>
                      <div className="flex gap-4">
                        <div className="text-sm font-medium text-secondary">Loratadine</div>
                        <div className="text-sm font-medium text-secondary">Fexofenadine</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Button variant="primary" className="flex-1 py-4 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">save</span>
                    Save to Records
                  </Button>
                  <Button variant="secondary" className="flex-1 py-4 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">share</span>
                    Share with Doctor
                  </Button>
                </div>
              </Card>

              {/* Health Tip Card */}
              <div className="bg-tertiary/10 text-on-surface rounded-3xl p-6 flex gap-4 items-start">
                <div className="p-3 bg-tertiary/20 rounded-2xl text-tertiary">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <div>
                  <h4 className="font-bold font-display mb-1 text-tertiary">Human Touch Tip</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Always confirm AI-extracted data with a certified pharmacist before purchasing medication. Ensure your scan includes the physician&apos;s signature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PermanentChatbot />
    </>
  );
}
