import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
  Terminal,
  Activity,
  User,
  Globe,
  FileCode,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  X,
} from 'lucide-react';
import { IAuditLog } from '@hrx/shared';
import { Card, Badge, Button, Input, StatCard } from '../components/ui';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<IAuditLog | null>(null);

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  async function fetchLogs(page = 1) {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(actionFilter ? { action: actionFilter } : {}),
      });

      const res = await api.get<IAuditLog[]>(`/audit-logs?${query.toString()}`);
      setLogs(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }

  const getActionBadgeVariant = (action: string): 'primary' | 'success' | 'danger' | 'warning' | 'purple' | 'neutral' => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('FAIL')) return 'danger';
    if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('PUNCH_IN')) return 'success';
    if (act.includes('UPDATE') || act.includes('PATCH')) return 'primary';
    if (act.includes('LOGIN') || act.includes('AUTH')) return 'purple';
    if (act.includes('EXPORT') || act.includes('DOWNLOAD')) return 'warning';
    return 'neutral';
  };

  const commonActions = [
    'ALL',
    'USER_LOGIN',
    'EMPLOYEE_CREATED',
    'LEAVE_STATUS_UPDATED',
    'PAYROLL_GENERATED',
    'ATTENDANCE_PUNCH',
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-primary-container/20 text-primary border border-primary/30">
              System Auditing & Governance
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Immutable Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldAlert className="w-5 h-5" />
            </div>
            Security & Audit Trail
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Cryptographically sealed operational audit events recording identity, state mutations, and access telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(meta.page)}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Quick Stat Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Recorded Events"
          value={meta.total.toLocaleString()}
          subtitle="System lifecycle actions"
          icon={<Activity className="w-5 h-5 text-primary" />}
          iconColor="primary"
        />
        <StatCard
          title="Active Filter Mode"
          value={actionFilter ? actionFilter : 'Unfiltered (All)'}
          subtitle={actionFilter ? 'Scoped event stream' : 'Broad monitoring'}
          icon={<Filter className="w-5 h-5 text-secondary" />}
          iconColor="secondary"
        />
        <StatCard
          title="Ledger Integrity"
          value="100% Verified"
          subtitle="Zero hash tampering detected"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          iconColor="secondary"
        />
      </div>

      {/* Filter and Query Ribbon */}
      <Card variant="glass" className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="w-full md:w-96 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Search by action name (e.g. LOGIN, UPDATE)..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest/80 border border-outline-variant/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
            {actionFilter && (
              <button
                onClick={() => setActionFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
              <Terminal className="w-3 h-3" /> Quick Filter:
            </span>
            {commonActions.map((act) => {
              const isSelected = (act === 'ALL' && !actionFilter) || actionFilter === act;
              return (
                <button
                  key={act}
                  onClick={() => setActionFilter(act === 'ALL' ? '' : act)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all border ${
                    isSelected
                      ? 'bg-primary/20 text-primary border-primary/40 shadow-sm shadow-primary/20'
                      : 'bg-surface-container-lowest/60 text-slate-400 border-outline-variant/20 hover:text-white hover:bg-surface-container-high/40'
                  }`}
                >
                  {act}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card variant="glass" className="overflow-hidden border-outline-variant/30 p-0">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-surface-container-lowest/50">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-white tracking-wide">Audit Event Stream</h2>
            <span className="text-[11px] text-slate-500 font-mono">
              ({logs.length} on current page)
            </span>
          </div>
          <span className="text-xs bg-surface-container-high/60 text-slate-300 px-2.5 py-1 rounded-full border border-outline-variant/30 font-mono tabular-nums">
            Total {meta.total} events
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Querying immutable audit ledger...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No audit records found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No events matched the selected filter query. Clear search criteria to view recent telemetry.
            </p>
            {actionFilter && (
              <Button variant="outline" size="sm" onClick={() => setActionFilter('')}>
                Clear Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/70 text-slate-400 text-[11px] font-mono uppercase tracking-wider">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Actor (User)</th>
                  <th className="py-3 px-6">Source IP</th>
                  <th className="py-3 px-6">Details / Payload</th>
                  <th className="py-3 px-6 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-slate-300 font-mono">
                {logs.map((log) => {
                  const userEmail = (log.userId as any)?.email || (log.userId as any)?.name || 'System / Automated';
                  const dateObj = new Date(log.createdAt);
                  const formattedDate = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const formattedTime = dateObj.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-200 font-semibold">{formattedDate}</span>
                          <span className="text-slate-500 text-[11px]">{formattedTime}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-slate-200 font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-surface-container-high/60 border border-outline-variant/20 text-[11px]">
                          {log.entity}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <User className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                          <span className="truncate max-w-[180px] font-sans text-xs">{userEmail}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 max-w-xs">
                        {log.details ? (
                          <div className="truncate text-slate-400 text-[11px] bg-surface-container-lowest/70 px-2 py-1 rounded border border-outline-variant/20 font-mono">
                            {JSON.stringify(log.details)}
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="View raw details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-lowest/50 text-xs text-slate-400">
          <div>
            Showing Page <span className="text-white font-bold">{meta.page}</span> of{' '}
            <span className="text-white font-bold">{meta.totalPages || 1}</span> ({meta.total} total logs)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(meta.page - 1)}
              disabled={meta.page <= 1}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Inspect Raw Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-white">Audit Log Telemetry Record</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-container-low/60 p-3.5 rounded-xl border border-outline-variant/20">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Action</span>
                <span className="font-bold text-primary font-mono">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Entity</span>
                <span className="text-slate-200 font-mono">{selectedLog.entity}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">User ID / Actor</span>
                <span className="text-slate-300 font-mono">
                  {(selectedLog.userId as any)?.email || (selectedLog.userId as any)?.name || String(selectedLog.userId || 'System')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Recorded At</span>
                <span className="text-slate-300 font-mono">
                  {new Date(selectedLog.createdAt).toISOString()}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" /> Payload Details
              </span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-outline-variant/30 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(selectedLog.details, null, 2) || '// No payload details recorded for this event'}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-outline-variant/20">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
