/* eslint-disable @next/next/no-img-element */
'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';
import { getApiBaseUrl, saveAuthSession } from '../../lib/auth';
import { CURRENT_TERMS_VERSION } from '../../lib/terms';

type ProfileForm = {
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  weight: string;
  height: string;
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [token, setToken] = useState('');

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    age: '',
    gender: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setError('Signup successful. Please login with your new credentials.');
    }
  }, [searchParams]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const emailErr = validateEmail(email);
    setEmailError(emailErr);
    if (emailErr) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          rememberMe: true,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Login failed');
      }

      saveAuthSession(payload.data.token, payload.data.user);
      setToken(payload.data.token);

      if (payload?.data?.requiresTermsConsent) {
        router.push(`/terms?consent=1&redirect=${encodeURIComponent('/profile')}`);
        return;
      }

      try {
        const profileRes = await fetch(`${getApiBaseUrl()}/profile`, {
          headers: {
            Authorization: `Bearer ${payload.data.token}`,
          },
          credentials: 'include',
        });

        const profilePayload = await profileRes.json();

        if (profilePayload?.success && profilePayload.data) {
          setProfileForm({
            age: profilePayload.data.age ? String(profilePayload.data.age) : '',
            gender: profilePayload.data.gender || '',
            weight: profilePayload.data.weight ? String(profilePayload.data.weight) : '',
            height: profilePayload.data.height ? String(profilePayload.data.height) : '',
          });
        }
      } catch {
        // Keep defaults if profile fetch fails.
      }

      setShowProfilePopup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) return;

    setSavingProfile(true);
    setError('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          age: Number(profileForm.age),
          gender: profileForm.gender,
          weight: Number(profileForm.weight),
          height: Number(profileForm.height),
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to save profile information');
      }

      setShowProfilePopup(false);
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setSavingProfile(false);
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
              <Icon name="health_and_safety" className="h-5 w-5" />
              <span className="text-sm font-semibold font-label">
                Clinical Serenity Architecture
              </span>
            </div>

            <h1 className="font-display text-5xl font-black text-on-surface leading-[1.1] tracking-tight">
              Your Personalized <br />
              <span className="text-primary">Medical Insights</span> <br />
              Start Here.
            </h1>

            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Access high-fidelity AI recommendations tailored to your unique symptoms and health profile.
            </p>

            <div className="relative w-full aspect-square max-w-md rounded-2xl overflow-hidden shadow-2xl">
              <img
                className="w-full h-full object-cover"
                alt="Medical tech environment"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp4bnfyNy6y_s3xFlARB4Zq9uvjg-vLM_jqJhqiet8x_z6wEwEMKL1EomLbWiuzZeO4I0lu1I06jdEEZce7fkL3eJFMER4azF8PFWzJnXFCRG1eucl9RlXsBaOQtxdqWoKmevbV82D8VK9gH7hPSpOYKsd4w9pltRvyOCphcA3aB_7JaEoDOwSuqSNzh0MrwUmWn9iZHqIhdsUWF9-dFTxm17haFM-_qTbLLlV8OYGuppTpVWWb4OBnbWzb9Mc0joIufu84s4QGwjX"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-start w-full max-w-md mx-auto">
            <div className="w-full bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-ambient">
              <div className="text-center lg:text-left mb-10">
                <div className="font-display font-black text-2xl text-primary mb-2">
                  AI Medicine Rec
                </div>
                <h2 className="font-display text-3xl font-bold text-on-surface">
                  Welcome back
                </h2>
                <p className="text-on-surface-variant mt-2 font-label text-sm">
                  Please enter your credentials
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} method="post" action="/login">
                <Input
                  type="email"
                  id="email"
                  name="email"
                  label="Email"
                  placeholder="doctor@clinic.com"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  rightIcon={showPassword ? 'visibility_off' : 'visibility'}
                  onRightIconClick={() => setShowPassword((prev) => !prev)}
                  required
                />

                {error ? (
                  <p className="text-sm text-error bg-error-container/40 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                ) : null}

                <Button
                  variant="primary"
                  className="w-full py-4 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Logging in...' : 'Login'}</span>
                  <Icon name="arrow_forward" className="h-5 w-5" />
                </Button>

                <p className="text-sm text-on-surface-variant text-center">
                  New user?{' '}
                  <Link href="/signup" className="text-primary font-bold">
                    Create account
                  </Link>
                </p>

                <p className="text-xs text-on-surface-variant text-center">
                  By continuing, you agree to{' '}
                  <Link href="/terms" className="text-primary font-semibold hover:underline">
                    Terms & Conditions
                  </Link>{' '}
                  (Version {CURRENT_TERMS_VERSION}).
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {showProfilePopup ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-xl rounded-[2rem] overflow-hidden border border-outline-variant/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest via-surface to-surface-container-low"></div>

            <div className="relative p-8 md:p-10">
              <div className="mb-8">
                <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                  <Icon name="verified_user" className="h-4 w-4" />
                  One-Time Setup
                </p>

                <h3 className="text-3xl font-display font-black text-on-surface mt-4">
                  Complete Your Health Snapshot
                </h3>

                <p className="text-on-surface-variant mt-2">
                  Add your basic details so recommendations become more personalized and safe.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleProfileSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    type="number"
                    label="Age"
                    placeholder="e.g. 28"
                    min={1}
                    max={120}
                    value={profileForm.age}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        age: event.target.value,
                      }))
                    }
                    required
                  />

                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-medium text-on-surface-variant">
                      Gender
                    </label>

                    <select
                      className="bg-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:bg-surface-container-lowest transition-all"
                      value={profileForm.gender}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          gender: event.target.value as ProfileForm['gender'],
                        }))
                      }
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <Input
                    type="number"
                    label="Weight (kg)"
                    placeholder="e.g. 62.5"
                    min={1}
                    step="0.1"
                    value={profileForm.weight}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        weight: event.target.value,
                      }))
                    }
                    required
                  />

                  <Input
                    type="number"
                    label="Height (cm)"
                    placeholder="e.g. 170"
                    min={1}
                    step="0.1"
                    value={profileForm.height}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        height: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <Button
                  variant="primary"
                  className="w-full py-4 mt-2 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={savingProfile}
                >
                  <span>{savingProfile ? 'Saving profile...' : 'Save & Continue'}</span>
                  <Icon name="arrow_forward" className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-on-surface">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}