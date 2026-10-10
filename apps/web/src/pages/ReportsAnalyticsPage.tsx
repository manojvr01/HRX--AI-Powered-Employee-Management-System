import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Download,
  Users,
  CalendarCheck,
  CalendarDays,
  DollarSign,
  Star,
  FileSpreadsheet,
} from 'lucide-react';

export function ReportsAnalyticsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Export State
  const [exportType, setExportType] = useState<'employees' | 'attendance' | 'payroll' | 'leaves'>('employees');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      setLoading(true);
      const res = await api.get<{ data: any }>('/analytics/overview');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(e: React.FormEvent) {
    e.preventDefault();
    setExporting(true);
    try {
      const query = new URLSearchParams({
        type: exportType,
        format: 'csv',
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });

      const token = localStorage.getItem('accessToken') || '';
      const response = await fetch(`/api/v1/reports/export?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to generate export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hrx-${exportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-indigo-400" />
          Analytics & Report Center
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          High-level operational metrics and compliance report exports.
        </p>
      </div>

      {/* Analytics Cards */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading analytics metrics...</div>
      ) : metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Scoped Headcount</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.headcount?.total || 0}</div>
            <div className="text-xs text-emerald-400">
              {metrics.headcount?.active || 0} currently active
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Attendance Rate (30d)</span>
              <CalendarCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {metrics.attendance?.ratePercentage || 0}%
            </div>
            <div className="text-xs text-slate-400">
              {metrics.attendance?.recordsInLast30Days || 0} logs recorded
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Leave Summary</span>
              <CalendarDays className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {metrics.leaves?.APPROVED || 0}
            </div>
            <div className="text-xs text-amber-400">
              {metrics.leaves?.PENDING || 0} pending review
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Net Payroll Outflow</span>
              <DollarSign className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              ${(metrics.payroll?.totalNet || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">
              {metrics.payroll?.processedCount || 0} records processed
            </div>
          </div>
        </div>
      ) : null}

      {/* Performance Ratings Distribution */}
      {metrics?.performance && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              Performance Rating Distribution
            </h2>
            <span className="text-xs text-slate-400">
              {metrics.performance.totalReviews} total appraisals
            </span>
          </div>
          <div className="grid grid-cols-5 gap-3 text-center text-xs">
            {metrics.performance.ratingDistribution?.map((item: any) => (
              <div key={item.stars} className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-center text-amber-400 mb-1">
                  {Array.from({ length: item.stars }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-lg font-bold text-white">{item.count}</div>
                <div className="text-[10px] text-slate-500">reviews</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Export Center */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Data Export Center (CSV)</h2>
        </div>
        <p className="text-xs text-slate-400">
          Generate encrypted, audit-logged CSV exports strictly scoped to your authorized role and team visibility.
        </p>

        <form onSubmit={handleExport} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Report Dataset</label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
            >
              <option value="employees">Employees Directory</option>
              <option value="attendance">Attendance Records</option>
              <option value="payroll">Payroll Master</option>
              <option value="leaves">Leave Applications</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Start Date (Optional)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">End Date (Optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium shadow-md shadow-indigo-600/20 transition-all"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Generating...' : 'Download CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
