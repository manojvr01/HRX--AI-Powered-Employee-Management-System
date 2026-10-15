import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  Users,
  Building2,
  UserCheck,
  TrendingUp,
  Calendar,
  Briefcase,
  Shield,
  Layers,
  Palmtree,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 glass-panel rounded-2xl animate-pulse" />
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
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border-l-4 border-indigo-500">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user?.employee ? user.employee.firstName : user?.email}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {role === 'ADMIN' && 'Company-wide HRMS overview and administration metrics.'}
            {role === 'HR' && 'Human resources team metrics and active employee tracking.'}
            {role === 'MANAGER' && 'Your team reporting lines and department metrics.'}
            {role === 'EMPLOYEE' && 'Your employee portal and balance summaries.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {role} Portal
          </span>
        </div>
      </div>

      {/* 1. ADMIN & HR VIEW */}
      {(role === 'ADMIN' || role === 'HR') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Employees
                </p>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {metrics.totalEmployees || 0}
                </p>
                <p className="text-xs text-indigo-400 mt-1">Active Headcount</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Staff
                </p>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {metrics.activeEmployees || 0}
                </p>
                <p className="text-xs text-emerald-400 mt-1">Regular Status</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Departments
                </p>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {metrics.totalDepartments || 0}
                </p>
                <p className="text-xs text-indigo-400 mt-1">Operational Units</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <Link
              to="/leave"
              className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-amber-500/50 transition group"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pending Leaves
                </p>
                <p className="text-3xl font-extrabold text-white mt-1 group-hover:text-amber-300 transition">
                  {metrics.pendingLeaves || 0}
                </p>
                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1 font-semibold">
                  <span>Review Approvals</span>
                  <span className="text-[10px]">&rarr;</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                <Palmtree className="w-6 h-6" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Department Distribution
              </h2>
              <div className="space-y-3">
                {metrics.departmentDistribution?.map((item: any, idx: number) => {
                  const percentage =
                    metrics.totalEmployees > 0
                      ? Math.round((item.count / metrics.totalEmployees) * 100)
                      : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="text-slate-400">
                          {item.count} staff ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Employees */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Recent Staff
                </h2>
                <Link
                  to="/employees"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  View All &rarr;
                </Link>
              </div>

              <div className="divide-y divide-slate-800/80">
                {metrics.recentEmployees?.map((emp: any) => (
                  <div key={emp._id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {emp.position} &bull; {emp.departmentId?.name || 'Unassigned'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {emp.employeeCode}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. MANAGER VIEW */}
      {role === 'MANAGER' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  My Team Size
                </p>
                <p className="text-3xl font-extrabold text-white mt-1">{metrics.teamSize || 0}</p>
                <p className="text-xs text-emerald-400 mt-1">Direct Reports</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Department
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {metrics.department || 'Engineering'}
                </p>
                <p className="text-xs text-indigo-400 mt-1">Assigned Division</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <Link
              to="/leave"
              className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-amber-500/50 transition group"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Team Pending Leaves
                </p>
                <p className="text-3xl font-extrabold text-white mt-1 group-hover:text-amber-300 transition">
                  {metrics.pendingLeaves || 0}
                </p>
                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1 font-semibold">
                  <span>Review Approvals</span>
                  <span className="text-[10px]">&rarr;</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                <Palmtree className="w-6 h-6" />
              </div>
            </Link>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Team Members (Scoped Reports)
              </h2>
              <Link
                to="/employees"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Team Directory &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.directReports?.map((rep: any) => (
                <div
                  key={rep._id}
                  className="p-4 rounded-xl glass-card flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm">
                      {rep.firstName[0]}
                      {rep.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {rep.firstName} {rep.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{rep.position}</p>
                      <p className="text-[11px] text-slate-500">{rep.email}</p>
                    </div>
                  </div>
                  <Link
                    to={`/employees/${rep._id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 3. EMPLOYEE VIEW */}
      {role === 'EMPLOYEE' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl md:col-span-1 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-sky-500/20">
                {metrics.profile?.firstName?.[0]}
                {metrics.profile?.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {metrics.profile?.firstName} {metrics.profile?.lastName}
                </h2>
                <p className="text-xs text-sky-400 font-semibold">{metrics.profile?.position}</p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Code: {metrics.profile?.employeeCode}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
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
                  <span className="text-slate-200 font-medium">
                    {metrics.profile?.joiningDate || '2024-02-01'}
                  </span>
                </div>
              </div>

              <Link
                to={user?.employee?.id ? `/employees/${user.employee.id}` : '#'}
                className="block text-center w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Edit My Contact Info
              </Link>
            </div>

            {/* Leave Balances Grid */}
            <div className="glass-panel p-6 rounded-2xl md:col-span-2 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                My Leave Balances (2026)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.leaveBalances?.map((b: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl glass-card space-y-2">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {b.name}
                    </p>
                    <p className="text-3xl font-extrabold text-white">{b.remaining}</p>
                    <p className="text-[11px] text-slate-400">
                      Allocated: {b.allocated} | Used: {b.used}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Quick Notice</p>
                <p className="mt-1">
                  Your leave requests and attendance logs are updated automatically upon approval.
                  Contact your team lead or HR for statutory adjustments.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
