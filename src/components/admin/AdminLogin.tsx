import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AdminLoginProps {
  onAuthenticated: (token: string, email: string) => void;
  onNavigatePublic: () => void;
}

export function AdminLogin({ onAuthenticated, onNavigatePublic }: AdminLoginProps) {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/auth-status')
      .then((res) => res.json())
      .then((data: { needsSetup?: boolean }) => {
        if (active) {
          setNeedsSetup(Boolean(data.needsSetup));
        }
      })
      .catch(() => {
        if (active) setError('Unable to reach authentication server.');
      })
      .finally(() => {
        if (active) setCheckingStatus(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (needsSetup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = needsSetup ? '/api/admin/setup' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as {
        token?: string;
        admin?: { email: string; role: string };
        error?: string;
      };

      if (!res.ok || !data.token || !data.admin) {
        setError(data.error ?? 'Authentication failed.');
        return;
      }

      onAuthenticated(data.token, data.admin.email);
    } catch {
      setError('Network error while signing in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-neutral-100 flex flex-col justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={onNavigatePublic}
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Website</span>
        </button>

        <div className="bg-[#111114] border border-neutral-800 rounded-xl p-7 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
              {needsSetup ? <KeyRound className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-medium text-orange-400">Bhopal Wheel Self Drive</p>
              <h1 className="font-display text-xl font-bold text-white">
                {needsSetup ? 'Initialize Admin Account' : 'Admin Console Sign In'}
              </h1>
            </div>
          </div>

          {checkingStatus ? (
            <div className="py-8 space-y-3 animate-pulse">
              <div className="h-10 bg-neutral-800 rounded-lg" />
              <div className="h-10 bg-neutral-800 rounded-lg" />
              <div className="h-11 bg-neutral-800 rounded-lg" />
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                {needsSetup
                  ? 'First-time setup: create your administrator email and password to secure the fleet management console.'
                  : 'Sign in with your administrator credentials to manage fleet pricing, vehicle availability, and website settings.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="admin-email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="admin-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="admin@bhopalwheelselfdrive.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="admin-password"
                      type="password"
                      required
                      minLength={needsSetup ? 8 : 1}
                      autoComplete={needsSetup ? 'new-password' : 'current-password'}
                      placeholder={needsSetup ? 'Minimum 8 characters' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {needsSetup && (
                  <div>
                    <label
                      htmlFor="admin-confirm-password"
                      className="block text-xs font-medium text-neutral-300 mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-confirm-password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="p-3 text-xs font-medium text-red-400 bg-red-950/50 border border-red-900 rounded-lg"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 px-4 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {submitting
                    ? 'Verifying...'
                    : needsSetup
                      ? 'Create Admin Account & Enter'
                      : 'Sign In to Dashboard'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
