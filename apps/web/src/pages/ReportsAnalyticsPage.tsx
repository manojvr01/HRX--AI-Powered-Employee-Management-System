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
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            Intelligence & Auditing
          </span>
          <span className="text-xs text-text-muted">Real-time Metrics Aggregation</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
          <BarChart3 className="h-7 w-7 text-primary" />
          Analytics & Intelligence Center
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          High-level operational metrics, performance distribution, and compliance CSV exports
        </p>
      </div>

      {/* Analytics Cards */}
      {loading ? (
        <div className="p-12 text-center text-text-muted font-mono text-xs glass-card">
          Loading analytics metrics...
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Scoped Headcount"
            value={metrics.headcount?.total || 0}
            icon={<Users className="w-5 h-5 text-primary" />}
            subtitle={`${metrics.headcount?.active || 0} currently active`}
            iconColor="primary"
          />
          <StatCard
            title="Attendance Rate (30d)"
            value={`${metrics.attendance?.ratePercentage || 0}%`}
            icon={<CalendarCheck className="w-5 h-5 text-secondary" />}
            subtitle={`${metrics.attendance?.recordsInLast30Days || 0} logs recorded`}
            iconColor="secondary"
          />
          <StatCard
            title="Leave Summary"
            value={metrics.leaves?.APPROVED || 0}
            icon={<CalendarDays className="w-5 h-5 text-tertiary" />}
            subtitle={`${metrics.leaves?.PENDING || 0} pending review`}
            iconColor="tertiary"
          />
          <StatCard
            title="Net Payroll Outflow"
            value={`$${(metrics.payroll?.totalNet || 0).toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5 text-secondary" />}
            subtitle={`${metrics.payroll?.processedCount || 0} cycles processed`}
            iconColor="secondary"
          />
        </div>
      ) : null}

      {/* Performance Ratings Distribution */}
      {metrics?.performance && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-tertiary" />
                  Performance Rating Distribution
                </CardTitle>
                <CardDescription>
                  Aggregated star appraisal distribution across team cycles
                </CardDescription>
              </div>
              <Badge variant="warning">
                {metrics.performance.totalReviews} total appraisals
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3 text-center text-xs">
              {metrics.performance.ratingDistribution?.map((item: any) => (
                <div
                  key={item.stars}
                  className="bg-surface-highest/40 p-4 rounded-xl border border-white/[0.06] hover:border-tertiary/40 transition-colors"
                >
                  <div className="flex justify-center text-tertiary mb-1.5 gap-0.5">
                    {Array.from({ length: item.stars }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-tertiary text-tertiary" />
                    ))}
                  </div>
                  <div className="text-xl font-black text-white font-mono">{item.count}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">reviews</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Export Center */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Data Export Center (CSV)</CardTitle>
              <CardDescription>
                Generate encrypted, audit-logged CSV exports strictly scoped to your authorized role and team visibility
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleExport} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Report Dataset *
              </label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
              >
                <option value="employees" className="bg-surface-darker text-white">Employees Directory</option>
                <option value="attendance" className="bg-surface-darker text-white">Attendance Records</option>
                <option value="payroll" className="bg-surface-darker text-white">Payroll Master</option>
                <option value="leaves" className="bg-surface-darker text-white">Leave Applications</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <Button
                type="submit"
                disabled={exporting}
                variant="primary"
                className="w-full shadow-glow"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Generating...' : 'Download CSV'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

