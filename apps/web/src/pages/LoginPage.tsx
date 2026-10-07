import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.error?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setError(null);
    setIsSubmitting(true);
    try {
      await login(roleEmail, 'Password123!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.error?.message || err.message || 'Login failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center shadow-xl shadow-indigo-600/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign in to HRX
          </h1>
          <p className="text-sm text-slate-400">
            Enterprise-Grade AI-Powered Employee Management
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl space-y-6 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  id="input-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  id="input-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Switcher */}
          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick Demo Logins (Password: Password123!)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-admin"
                onClick={() => handleQuickLogin('admin@hrx.local')}
                className="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 hover:bg-indigo-600/10 text-xs font-medium text-indigo-300 text-left transition flex items-center justify-between"
              >
                <span>Admin</span>
                <span className="text-[10px] text-slate-400">Alex</span>
              </button>

              <button
                type="button"
                id="btn-demo-hr"
                onClick={() => handleQuickLogin('hr@hrx.local')}
                className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 hover:bg-amber-600/10 text-xs font-medium text-amber-300 text-left transition flex items-center justify-between"
              >
                <span>HR</span>
                <span className="text-[10px] text-slate-400">Elena</span>
              </button>

              <button
                type="button"
                id="btn-demo-manager"
                onClick={() => handleQuickLogin('manager@hrx.local')}
                className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:bg-emerald-600/10 text-xs font-medium text-emerald-300 text-left transition flex items-center justify-between"
              >
                <span>Manager</span>
                <span className="text-[10px] text-slate-400">Marcus</span>
              </button>

              <button
                type="button"
                id="btn-demo-employee"
                onClick={() => handleQuickLogin('employee@hrx.local')}
                className="p-2.5 rounded-xl bg-slate-900 border border-sky-500/30 hover:bg-sky-600/10 text-xs font-medium text-sky-300 text-left transition flex items-center justify-between"
              >
                <span>Employee</span>
                <span className="text-[10px] text-slate-400">Sarah</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
