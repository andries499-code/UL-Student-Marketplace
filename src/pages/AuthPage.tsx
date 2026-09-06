import { useState } from 'react';
import { GraduationCap, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isCampusEmail } from '@/lib/constants';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = isCampusEmail(email);
  const showEmailError = email.length > 0 && !emailValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && !emailValid) {
      setError('Please use a valid .ac.za campus email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    setSubmitting(true);
    const result =
      mode === 'signup'
        ? await signUp(email.trim(), password, fullName.trim())
        : await signIn(email.trim(), password);
    setSubmitting(false);

    if (result.error) setError(result.error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      <header className="px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200 mb-4">
          <GraduationCap className="w-9 h-9 text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">UL Student Market</h1>
        <p className="text-sm text-gray-500 mt-1">University of Limpopo peer-to-peer marketplace</p>
      </header>

      <main className="flex-1 px-6 pb-10 flex flex-col items-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 sm:p-8">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'signin' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Thabo Mokoena"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Campus Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@keystudent.ul.ac.za"
                className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                  showEmailError
                    ? 'border-rose-300 focus:ring-rose-400/30 focus:border-rose-400'
                    : 'border-gray-200 focus:ring-emerald-500/40 focus:border-emerald-400'
                }`}
              />
              {showEmailError && (
                <p className="text-xs text-rose-600 mt-1.5">
                  Only .ac.za campus emails are allowed (e.g. @keystudent.ul.ac.za).
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed">
              Registration is restricted to verified <strong>.ac.za</strong> campus emails to keep the marketplace safe for UL students only.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center pb-6 text-xs text-gray-400">
        University of Limpopo Student Marketplace
      </footer>
    </div>
  );
}
