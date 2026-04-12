import { Navbar } from '../../components/layout/Navbar';
import { PermanentChatbot } from '../../components/layout/PermanentChatbot';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Link from 'next/link';

export default function Login() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex items-center justify-center relative overflow-hidden px-4 md:px-8 py-20 min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 -right-48 w-[32rem] h-[32rem] bg-secondary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-tertiary/5 rounded-full blur-[80px]"></div>
        </div>
        
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 pt-16">
          
          {/* Left Column (Desktop) */}
          <div className="hidden lg:block space-y-8 pr-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full mb-4">
              <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
              <span className="text-sm font-semibold font-label">Clinical Serenity Architecture</span>
            </div>
            <h1 className="font-display text-5xl font-black text-on-surface leading-[1.1] tracking-tight">
              Your Personalized <br/>
              <span className="text-primary">Medical Insights</span> <br/>
              Start Here.
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Access high-fidelity AI recommendations tailored to your unique symptoms and health profile. Experience the future of medical clarity.
            </p>
            <div className="relative w-full aspect-square max-w-md rounded-2xl overflow-hidden shadow-2xl">
              <img 
                className="w-full h-full object-cover" 
                alt="Medical tech environment" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp4bnfyNy6y_s3xFlARB4Zq9uvjg-vLM_jqJhqiet8x_z6wEwEMKL1EomLbWiuzZeO4I0lu1I06jdEEZce7fkL3eJFMER4azF8PFWzJnXFCRG1eucl9RlXsBaOQtxdqWoKmevbV82D8VK9gH7hPSpOYKsd4w9pltRvyOCphcA3aB_7JaEoDOwSuqSNzh0MrwUmWn9iZHqIhdsUWF9-dFTxm17haFM-_qTbLLlV8OYGuppTpVWWb4OBnbWzb9Mc0joIufu84s4QGwjX"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 glass-card p-4 rounded-xl border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container">verified_user</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold font-display text-on-surface">HIPAA Compliant</p>
                    <p className="text-xs text-on-surface-variant">Your data is encrypted & secured</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column (Form) */}
          <div className="flex flex-col items-center lg:items-start w-full max-w-md mx-auto">
            <div className="w-full bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-ambient">
              <div className="text-center lg:text-left mb-10">
                <div className="font-display font-black text-2xl text-primary mb-2">AI Medicine Rec</div>
                <h2 className="font-display text-3xl font-bold text-on-surface">Welcome back</h2>
                <p className="text-on-surface-variant mt-2 font-label text-sm">Please enter your clinical credentials</p>
              </div>
              
              <form className="space-y-6">
                <Input 
                  type="email" 
                  id="email" 
                  name="email"
                  label="Email"
                  placeholder="doctor@clinic.com"
                  required 
                />
                
                <div className="space-y-1.5 flex flex-col w-full">
                  <div className="flex justify-between items-center ml-1 w-full relative">
                    <label className="text-sm font-label font-medium text-on-surface-variant z-10" htmlFor="password">Password</label>
                    <a className="text-xs font-bold text-primary hover:text-primary-container transition-colors z-20 absolute right-0" href="#">Forgot Password?</a>
                  </div>
                  <Input 
                    type="password" 
                    id="password" 
                    name="password"
                    placeholder="••••••••"
                    required 
                  />
                </div>
                
                <div className="pt-4 space-y-4">
                  <Button variant="primary" className="w-full py-4 flex items-center justify-center gap-2" type="submit">
                    <span>Login</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Button>
                  
                  <div className="relative py-2">
                    <div aria-hidden="true" className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-outline-variant/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-surface-container-lowest text-on-surface-variant font-label">or</span>
                    </div>
                  </div>
                  
                  <Button variant="secondary" className="w-full py-4" type="button">
                    Signup
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
        </div>
      </main>
      <PermanentChatbot />
    </>
  );
}
