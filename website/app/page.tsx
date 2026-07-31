'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Eye, EyeOff, Home, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/app-store';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestRole, setGuestRole] = useState('Family Member');

  const goToDashboard = async (provider: 'email' | 'facebook' | 'guest' | 'google') => {
    try {
      setAuthError('');
      setAuthMessage('');
      await signIn(provider, email, guestName, guestAge, guestRole, password, isCreateAccount);
      // Fallback manual push if the useEffect doesn't trigger fast enough
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in failed or was cancelled:', error);
      setAuthError(error instanceof Error ? error.message : 'Could not sign in. Please try again.');
    }
  };



  // Auto-redirect if already logged in (e.g., page refresh or successful background sign-in)
  React.useEffect(() => {
    if (user?.uid) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleAuthSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isGuestMode) {
      goToDashboard('guest');
    } else {
      goToDashboard('email');
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-[1fr_460px]">
      <section className="hidden lg:flex flex-col justify-between p-10 bg-white border-r border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">MedHome</h1>
            <p className="text-sm text-slate-500">Family medicine command center</p>
          </div>
        </div>

        <div className="max-w-xl space-y-6">
          <div>
            <p className="text-sm font-semibold text-teal-700">Secure household care</p>
            <h2 className="text-5xl font-bold text-slate-950 mt-3 leading-tight">
              Manage medicines, reminders, and restocks in one calm place.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <ShieldCheck className="w-5 h-5 text-teal-600 mb-3" />
              <p className="text-sm font-semibold text-slate-900">Family profiles</p>
              <p className="text-xs text-slate-500 mt-1">Separate medicines and allergies.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <CalendarCheck className="w-5 h-5 text-teal-600 mb-3" />
              <p className="text-sm font-semibold text-slate-900">Calendar sync</p>
              <p className="text-xs text-slate-500 mt-1">Plan doses and restocks.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <BellIcon />
              <p className="text-sm font-semibold text-slate-900">Smart alerts</p>
              <p className="text-xs text-slate-500 mt-1">Low stock, expiry, duplicates.</p>
            </div>
          </div>
        </div>


      </section>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-7">
          <div className="lg:hidden flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
              <Home className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">MedHome</h1>
            <p className="text-slate-600 text-center text-sm">Manage family medicines together</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-7 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                {isGuestMode ? 'Guest Setup' : (isCreateAccount ? 'Create account' : 'Sign in')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isGuestMode ? 'Tell us a bit about yourself.' : 'Open your household dashboard.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isGuestMode ? (
                <>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Name</span>
                    <span className="relative block">
                      <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="John Doe"
                      />
                    </span>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Age</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={guestAge}
                      onChange={(e) => setGuestAge(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="e.g. 35"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Role in household</span>
                    <select
                      value={guestRole}
                      onChange={(e) => setGuestRole(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="Host">Host</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Child">Child</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Caregiver">Caregiver</option>
                      <option value="Family Member">Other Family Member</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Email address</span>
                    <span className="relative block">
                      <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </span>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Password</span>
                    <span className="relative block">
                      <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </span>
                  </label>
                </>
              )}

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                {isGuestMode ? 'Enter as Guest' : (isCreateAccount ? 'Create Account' : 'Sign in')}
              </Button>
              {authError && <p className="text-sm font-medium text-red-600">{authError}</p>}
              {authMessage && <p className="text-sm font-medium text-teal-700">{authMessage}</p>}

              {!isGuestMode && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">Or continue with</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToDashboard('google')}
                    className="w-full border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </Button>
                </>
              )}
            </form>





            <div className="flex flex-col gap-2 text-sm text-center">
              {isGuestMode ? (
                <button type="button" onClick={() => setIsGuestMode(false)} className="text-slate-600 hover:text-slate-900 mt-2">
                  Back to login
                </button>
              ) : (
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateAccount(!isCreateAccount)}
                    className="text-teal-700 font-medium hover:text-teal-800"
                  >
                    {isCreateAccount ? 'Sign in instead' : 'Create account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGuestMode(true)}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Continue as guest
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="w-5 h-5 text-teal-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
