import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
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
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#040f1c] selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Left Column: Authentication Form */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-12 xl:px-20 py-10 relative z-10 border-r border-white/10 bg-[#04101e]/85 backdrop-blur-2xl">
        {/* Top Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                HR<span className="text-indigo-400">X</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-surface-highest text-indigo-300 border border-indigo-500/20 tracking-wider">
                Enterprise
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SSO Active</span>
          </div>
        </div>

        {/* Main Form Wrapper */}
        <div className="w-full max-w-sm mx-auto my-auto py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in to manage workforce intelligence and human capital workflows.
            </p>
          </div>

          {error && (
            <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick SSO Button */}
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@hrx.local')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-surface-container/60 hover:bg-surface-high text-xs sm:text-sm font-medium text-slate-200 transition-all shadow-sm focus:ring-2 focus:ring-indigo-500/30"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.25 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>Continue with Google Workspace</span>
          </button>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#04101e] px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold absolute">
              or work credentials
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input block w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPassword('Password123!');
                  }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Reset / Fill Demo
                </a>
              </div>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="glass-input block w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span>Trust this terminal for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white font-semibold text-sm shadow-glow-primary border border-indigo-400/30 transition-all duration-200 transform active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign in to HRX</span>
                  <ArrowRight className="w-4 h-4 text-indigo-200" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center font-mono">
              Quick Role Test Logins (Password: Password123!)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-admin"
                onClick={() => handleQuickLogin('admin@hrx.local')}
                className="p-2.5 rounded-xl bg-surface-container/70 border border-indigo-500/30 hover:bg-indigo-600/15 text-xs font-medium text-indigo-300 text-left transition flex items-center justify-between group"
              >
                <span>Admin</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-200">Alex</span>
              </button>

              <button
                type="button"
                id="btn-demo-hr"
                onClick={() => handleQuickLogin('hr@hrx.local')}
                className="p-2.5 rounded-xl bg-surface-container/70 border border-amber-500/30 hover:bg-amber-600/15 text-xs font-medium text-amber-300 text-left transition flex items-center justify-between group"
              >
                <span>HR Ops</span>
                <span className="text-[10px] text-slate-400 group-hover:text-amber-200">Elena</span>
              </button>

              <button
                type="button"
                id="btn-demo-manager"
                onClick={() => handleQuickLogin('manager@hrx.local')}
                className="p-2.5 rounded-xl bg-surface-container/70 border border-emerald-500/30 hover:bg-emerald-600/15 text-xs font-medium text-emerald-300 text-left transition flex items-center justify-between group"
              >
                <span>Manager</span>
                <span className="text-[10px] text-slate-400 group-hover:text-emerald-200">Marcus</span>
              </button>

              <button
                type="button"
                id="btn-demo-employee"
                onClick={() => handleQuickLogin('employee@hrx.local')}
                className="p-2.5 rounded-xl bg-surface-container/70 border border-sky-500/30 hover:bg-sky-600/15 text-xs font-medium text-sky-300 text-left transition flex items-center justify-between group"
              >
                <span>Employee</span>
                <span className="text-[10px] text-slate-400 group-hover:text-sky-200">Sarah</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              SOC 2 Type II
            </span>
            <span className="text-slate-700">•</span>
            <span>ISO 27001</span>
            <span className="text-slate-700">•</span>
            <span>256-bit AES</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white cursor-pointer">Security Protocol</span>
            <span className="hover:text-white cursor-pointer">Privacy</span>
          </div>
        </div>
      </div>

      {/* Right Column: Abstract 3D Gradient Visual & Neural Engine Showcase (Stitch Design) */}
      <div className="hidden lg:col-span-7 xl:col-span-7 relative lg:flex flex-col justify-between p-12 xl:p-16 overflow-hidden bg-[#020b14]">
        {/* Ambient Gradient Flares */}
        <div className="absolute -top-24 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/40 via-violet-600/25 to-transparent rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-[450px] h-[450px] bg-gradient-to-tr from-sky-500/25 via-indigo-600/20 to-transparent rounded-full blur-[90px] pointer-events-none" />

        {/* Right Header Status Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/70 border border-white/10 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-xs text-slate-200 font-medium font-mono">
              HRX Neural Engine v4.2 &bull; Active
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono tracking-tight bg-slate-900/50 px-3 py-1 rounded-lg border border-white/10">
            LATENCY: <span className="text-emerald-400 font-semibold font-mono">18ms</span>
          </div>
        </div>

        {/* Center 3D Vector Gyro / Torus Abstract Graphic */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-6">
          <div className="relative w-80 h-80 xl:w-96 xl:h-96 flex items-center justify-center">
            {/* Spinning decorative orbit rings */}
            <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[spin_50s_linear_infinite]" />
            <div className="absolute inset-8 rounded-full border border-dashed border-violet-500/25 animate-[spin_35s_linear_infinite_reverse]" />
            <div className="absolute inset-16 rounded-full border border-dotted border-sky-400/20 animate-[spin_25s_linear_infinite]" />

            {/* Glowing 3D Vector Torus / Gyro Centerpiece */}
            <svg
              className="w-full h-full drop-shadow-[0_20px_50px_rgba(99,102,241,0.35)]"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="primaryGrad" x1="50" y1="50" x2="350" y2="350" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="40%" stopColor="#6366F1" />
                  <stop offset="75%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#C084FC" />
                </linearGradient>
                <linearGradient id="innerGlow" x1="120" y1="100" x2="280" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#6366F1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#9333EA" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              <path
                d="M200 60 C 280 60, 340 120, 340 200 C 340 280, 280 340, 200 340 C 120 340, 60 280, 60 200 C 60 120, 120 60, 200 60 Z"
                stroke="url(#primaryGrad)"
                strokeWidth="28"
                strokeLinecap="round"
                className="opacity-90"
              />
              <path
                d="M130 150 C 160 110, 240 110, 270 150 C 300 190, 270 260, 200 270 C 140 280, 100 210, 130 150 Z"
                stroke="url(#innerGlow)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="12 8"
                className="opacity-75"
              />
              <circle cx="200" cy="200" r="28" fill="#6366F1" className="animate-pulse" />
              <circle cx="200" cy="200" r="14" fill="#ffffff" />
            </svg>
          </div>

          <div className="mt-8 text-center max-w-md space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Human Capital Autonomous Copilot
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time workforce intelligence, automated leave resolution, attendance analytics, and role-governed compliance in a single pane.
            </p>
          </div>
        </div>

        {/* Right Bottom Metrics */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
              Uptime SLA
            </p>
            <p className="text-lg font-bold text-white font-mono mt-0.5">99.98%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
              AI Predictive Accuracy
            </p>
            <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">94.4%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
              Security Standard
            </p>
            <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">AES-256</p>
          </div>
        </div>
      </div>
    </div>
  );
};
