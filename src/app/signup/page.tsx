'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';
import { getApiBaseUrl } from '../../lib/auth';
import { CURRENT_TERMS_VERSION } from '../../lib/terms';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (value: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).{8,}$/;
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!passwordRegex.test(value)) return 'Must include uppercase, lowercase, number & special character';
    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept Terms & Conditions and Medical Disclaimer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const registerResponse = await fetch(`${getApiBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          password,
          acceptTerms,
          termsVersion: CURRENT_TERMS_VERSION,
        }),
      });

      const registerPayload = await registerResponse.json();
      if (!registerResponse.ok || !registerPayload?.success) {
        throw new Error(registerPayload?.message || 'Signup failed');
      }
      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign up');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="hidden lg:block space-y-8 pr-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full mb-4">
              <Icon name="verified_user" className="h-5 w-5" />
              <span className="text-sm font-semibold font-label">Create Your Medical Account</span>
            </div>
            <h1 className="font-display text-5xl font-black text-on-surface leading-[1.1] tracking-tight">
              Secure Signup <br />
              <span className="text-primary">for Better Care</span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Build your health profile once, and get personalized recommendations powered by your own data.
            </p>
          </div>

          <div className="flex flex-col items-center lg:items-start w-full max-w-md mx-auto">
            <div className="w-full bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-ambient">
              <div className="text-center lg:text-left mb-10">
                <div className="font-display font-black text-2xl text-primary mb-2">AI Medicine Rec</div>
                <h2 className="font-display text-3xl font-bold text-on-surface">Create account</h2>
                <p className="text-on-surface-variant mt-2 font-label text-sm">Signup and start your medical journey</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} method="post" action="/signup">
                <Input
                  type="text"
                  id="name"
                  name="name"
                  label="Full Name"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />

                <Input
                  type="email"
                  id="email"
                  name="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setEmailError(''); }}
                  error={emailError}
                  required
                />

                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  label="Password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setPasswordError(''); }}
                  rightIcon={showPassword ? 'visibility_off' : 'visibility'}
                  onRightIconClick={() => setShowPassword((prev) => !prev)}
                  error={passwordError}
                  required
                />

                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  rightIcon={showConfirmPassword ? 'visibility_off' : 'visibility'}
                  onRightIconClick={() => setShowConfirmPassword((prev) => !prev)}
                  required
                />

                <label className="flex items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                    checked={acceptTerms}
                    onChange={(event) => setAcceptTerms(event.target.checked)}
                  />
                  <span className="text-sm text-on-surface-variant">
                    I agree to{' '}
                    <Link href="/terms" className="text-primary font-semibold hover:underline">
                      Terms & Conditions
                    </Link>{' '}
                    and Medical Disclaimer (Version {CURRENT_TERMS_VERSION}).
                  </span>
                </label>

                {error ? (
                  <p className="text-sm text-error bg-error-container/40 px-3 py-2 rounded-lg">{error}</p>
                ) : null}

                <Button
                  variant="primary"
                  className="w-full py-4 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Creating account...' : 'Signup'}</span>
                  <Icon name="arrow_forward" className="h-5 w-5" />
                </Button>

                <p className="text-sm text-on-surface-variant text-center">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary font-bold">
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
