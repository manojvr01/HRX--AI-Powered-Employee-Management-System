import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  Users,
  Building2,
  UserCheck,
  TrendingUp,
  Calendar,
  Layers,
  Palmtree,
  Sparkles,
  ArrowRight,
  Download,
  CalendarDays,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard, Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '../components/ui';
import { AiAssistantModal } from '../components/AiAssistantModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const res = await apiRequest('/dashboard/metrics');
        setData(res.data);
      } catch (err: any) {
        setError(err.error?.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-surface-container rounded-xl" />
        <div className="h-24 w-full bg-surface-container rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-surface-container rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const role = user?.role;
  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. TOP HEADER & ACTION BAR (Stitch Executive Overview) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {role === 'EMPLOYEE' ? 'My Workspace' : 'Executive Overview'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold font-mono border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-2 mt-1">
            <span>
              {role === 'ADMIN' && 'Real-time human capital analytics and workforce intelligence'}
              {role === 'HR' && 'Human resources team metrics and active employee tracking'}
              {role === 'MANAGER' && 'Your team reporting lines and department performance'}
              {role === 'EMPLOYEE' && 'Your personal attendance, leave balances, and profile overview'}
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-indigo-400 font-medium">Last synced just now</span>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-high text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors shadow-sm"
          >
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>Last 30 Days</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-high text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="relative group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white text-xs font-semibold shadow-glow-primary border border-indigo-400/30 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Ask HRX Copilot</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono">⌘J</span>
          </button>
        </div>
      </div>

      {/* 2. AI PREDICTIVE INSIGHT BANNER (Stitch Highlight Widget) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container via-surface-high to-surface-container p-4 sm:p-5 border border-white/10 shadow-glass">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Brain className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                  AI Predictive Insight
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-emerald-400 font-semibold font-mono">
                  High Confidence 94%
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200">
                Workforce stability is up <span className="text-emerald-400 font-semibold">+4.2%</span>.
                {metrics.pendingLeaves > 0 ? (
                  <>
                    {' '}
                    Notice:{' '}
                    <span className="text-amber-400 font-semibold">
                      {metrics.pendingLeaves} pending leave approval requests
                    </span>{' '}
                    require attention to prevent team bottleneck.
                  </>
                ) : (
                  ' All active team coverage metrics are within optimal thresholds.'
                )}
              </p>
            </div>
          </div>

          <Link
            to="/leave"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-highest hover:bg-surface-bright text-indigo-300 hover:text-white text-xs font-semibold border border-white/10 transition-all shrink-0"
          >
            <span>Review Coverage</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3. ADMIN & HR EXECUTIVE VIEW */}
      {(role === 'ADMIN' || role === 'HR') && (
        <>
          {/* Key Metric Stat Cards (4-Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Employees"
              value={metrics.totalEmployees || 0}
              subtitle="Active headcount across organization"
              icon={<Users className="w-5 h-5" />}
              iconColor="primary"
              delta={{ value: '+12 this Q', isPositive: true }}
              progress={{ value: 85, color: 'bg-indigo-500' }}
            />

            <StatCard
              title="Active Staff"
              value={metrics.activeEmployees || 0}
              subtitle="Regular verified status"
              icon={<UserCheck className="w-5 h-5" />}
              iconColor="secondary"
              delta={{ value: '98.4% Active', isPositive: true }}
              progress={{ value: 98, color: 'bg-emerald-400' }}
            />

            <StatCard
              title="Departments"
              value={metrics.totalDepartments || 0}
              subtitle="Operational business divisions"
              icon={<Building2 className="w-5 h-5" />}
              iconColor="tertiary"
              delta={{ value: '6 Hubs', isPositive: true }}
              progress={{ value: 75, color: 'bg-amber-400' }}
            />

            <Link to="/leave" className="block">
              <StatCard
                title="Pending Leaves"
                value={metrics.pendingLeaves || 0}
                subtitle="Awaiting management sign-off"
                icon={<Palmtree className="w-5 h-5" />}
                iconColor="error"
                delta={{
                  value: metrics.pendingLeaves > 0 ? 'Requires Action' : 'Cleared',
                  isPositive: metrics.pendingLeaves === 0,
                }}
                progress={{
                  value: Math.min((metrics.pendingLeaves || 0) * 15, 100),
                  color: 'bg-rose-400',
                }}
                className="hover:border-amber-500/40"
              />
            </Link>
          </div>

          {/* Two-Column Analytics Widgets (Stitch Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Department Headcount</CardTitle>
                    <CardDescription>Personnel allocation by department</CardDescription>
                  </div>
                </div>
                <Link
                  to="/departments"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Manage &rarr;
                </Link>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                {metrics.departmentDistribution && metrics.departmentDistribution.length > 0 ? (
                  metrics.departmentDistribution.map((item: any, idx: number) => {
                    const percentage =
                      metrics.totalEmployees > 0
                        ? Math.round((item.count / metrics.totalEmployees) * 100)
                        : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-200">{item.name}</span>
                          <span className="text-slate-400 font-mono">
                            {item.count} staff ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No department metrics recorded.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Staff Activity */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Recent Personnel</CardTitle>
                    <CardDescription>Newly boarded team members</CardDescription>
                  </div>
                </div>
                <Link
                  to="/employees"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  View All &rarr;
                </Link>
              </CardHeader>

              <CardContent className="divide-y divide-white/5 pt-0">
                {metrics.recentEmployees && metrics.recentEmployees.length > 0 ? (
                  metrics.recentEmployees.map((emp: any) => (
                    <div key={emp._id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-high border border-white/10 flex items-center justify-center font-bold text-xs text-indigo-300">
                          {emp.firstName?.[0]}
                          {emp.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {emp.position} &bull; {emp.departmentId?.name || 'General'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-surface-high text-indigo-300 border border-white/10">
                        {emp.employeeCode}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No employee records.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 4. MANAGER VIEW */}
      {role === 'MANAGER' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              title="My Team Size"
              value={metrics.teamSize || 0}
              subtitle="Direct scoped reports"
              icon={<Users className="w-5 h-5" />}
              iconColor="secondary"
              delta={{ value: 'Full Coverage', isPositive: true }}
              progress={{ value: 92, color: 'bg-emerald-400' }}
            />

            <StatCard
              title="Department"
              value={metrics.department || 'Engineering'}
              subtitle="Assigned organizational division"
              icon={<Building2 className="w-5 h-5" />}
              iconColor="primary"
            />

            <Link to="/leave" className="block">
              <StatCard
                title="Team Pending Leaves"
                value={metrics.pendingLeaves || 0}
                subtitle="Awaiting your manager sign-off"
                icon={<Palmtree className="w-5 h-5" />}
                iconColor="tertiary"
                delta={{
                  value: metrics.pendingLeaves > 0 ? 'Pending Action' : 'All Clear',
                  isPositive: metrics.pendingLeaves === 0,
                }}
              />
            </Link>
          </div>

          {/* Direct Reports Grid */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <div>
                  <CardTitle>Team Direct Reports</CardTitle>
                  <CardDescription>Personnel in your reporting line</CardDescription>
                </div>
              </div>
              <Link
                to="/employees"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Team Directory &rarr;
              </Link>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.directReports?.map((rep: any) => (
                  <div
                    key={rep._id}
                    className="p-4 rounded-xl glass-card flex items-center justify-between border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-sm">
                        {rep.firstName[0]}
                        {rep.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {rep.firstName} {rep.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{rep.position}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{rep.email}</p>
                      </div>
                    </div>
                    <Link
                      to={`/employees/${rep._id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition"
                    >
                      View Profile
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 5. EMPLOYEE VIEW */}
      {role === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employee Hero Profile Card */}
          <Card className="md:col-span-1 space-y-4">
            <CardContent className="pt-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-indigo-600/30">
                {metrics.profile?.firstName?.[0]}
                {metrics.profile?.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {metrics.profile?.firstName} {metrics.profile?.lastName}
                </h2>
                <p className="text-xs text-indigo-400 font-semibold">{metrics.profile?.position}</p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Code: {metrics.profile?.employeeCode}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department</span>
                  <span className="text-slate-200 font-medium">
                    {metrics.profile?.departmentId?.name || 'General'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Manager</span>
                  <span className="text-slate-200 font-medium">
                    {metrics.profile?.managerId
                      ? `${metrics.profile.managerId.firstName} ${metrics.profile.managerId.lastName}`
                      : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Joined</span>
                  <span className="text-slate-200 font-mono">
                    {metrics.profile?.joiningDate || '2024-02-01'}
                  </span>
                </div>
              </div>

              <Link
                to={user?.employee?.id ? `/employees/${user.employee.id}` : '#'}
                className="block text-center w-full py-2.5 rounded-xl bg-surface-high hover:bg-surface-highest text-xs font-semibold text-slate-200 border border-white/10 transition"
              >
                View Full Profile
              </Link>
            </CardContent>
          </Card>

          {/* Leave Balances Grid */}
          <Card className="md:col-span-2 space-y-4">
            <CardHeader className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <div>
                <CardTitle>My Leave Balances (2026)</CardTitle>
                <CardDescription>Allocated vs remaining quotas</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.leaveBalances?.map((b: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl glass-card space-y-2 border border-white/10">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      {b.name}
                    </p>
                    <p className="text-3xl font-extrabold text-white font-mono">{b.remaining}</p>
                    <p className="text-[11px] text-slate-400">
                      Allocated: {b.allocated} | Used: {b.used}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-surface-high/60 border border-white/10 text-xs text-slate-300 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Your attendance punches and leave requests sync automatically with the central
                  payroll system. For statutory adjustments, submit a request via the Leave tab.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Assistant Modal Integration */}
      <AiAssistantModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
    </div>
  );
};
