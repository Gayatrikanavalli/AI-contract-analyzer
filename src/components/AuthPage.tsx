import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Shield } from 'lucide-react';
import { loginUser, SessionUser, signupUser } from '../lib/api';

interface AuthPageProps {
  onAuthenticated: (user: SessionUser) => void;
  isSignup: boolean;
  onModeChange: (isSignup: boolean) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated, isSignup, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = isSignup
        ? await signupUser(email, password)
        : await loginUser(email, password);
      if (!result.success || !result.data?.user) {
        throw new Error(result.error || 'Authentication failed. Please try again.');
      }
      onAuthenticated(result.data.user);
    } catch (authError: any) {
      setError(authError.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#17143D] px-4 py-10 font-sans relative overflow-hidden">
      <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-[#6D5FE8]/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-7">
          <div className="w-11 h-11 bg-[#6D5FE8] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-950/40">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold tracking-tight">Contract Analyzer</div>
            <div className="text-indigo-300 text-xs">Private Legal AI Workspace</div>
          </div>
        </div>

        <div className="interactive-card bg-white rounded-2xl shadow-2xl shadow-black/25 border border-white/30 p-7 sm:p-9">
          <div className="mb-7">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6D5FE8] flex items-center justify-center mb-4">
              <LockKeyhole className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              {isSignup ? 'Sign up to create a private contract workspace.' : 'Sign in to access your private contract workspace.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Email address</span>
              <span className="relative block">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  maxLength={254}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#6D5FE8] focus:ring-2 focus:ring-indigo-100"
                  placeholder="you@company.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">Password</span>
              <span className="relative block">
                <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#6D5FE8] focus:ring-2 focus:ring-indigo-100"
                  placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </span>
              {isSignup && <span className="block text-[11px] text-slate-400 mt-1.5">Use 8–128 characters.</span>}
            </label>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="interactive-button w-full flex items-center justify-center gap-2 rounded-xl bg-[#6D5FE8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#5B4DE0] focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create account' : 'Sign in')}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
            {isSignup ? 'Already have an account?' : 'New to Contract Analyzer?'}{' '}
            <button
              type="button"
              onClick={() => { onModeChange(!isSignup); setError(''); }}
              className="interactive-link font-semibold text-[#5B4DE0] hover:text-indigo-800"
            >
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-indigo-200/70 mt-5">Your contracts are private to your account.</p>
      </div>
    </div>
  );
};
