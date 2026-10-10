import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ShieldAlert, RefreshCw, Filter } from 'lucide-react';
import { IAuditLog } from '@hrx/shared';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-rose-400" />
            Security & Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable system audit logs tracking administrative, authentication, and state modifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action..."
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500"
          />
          <button
            onClick={() => fetchLogs(meta.page)}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Audit Log Entries</h2>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700">
            {meta.total} Total Events
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading security logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Entity</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => {
                  const userEmail = (log.userId as any)?.email || 'System';
                  return (
                    <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-indigo-400">{log.action}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-300">{log.entity}</td>
                      <td className="px-6 py-3.5 text-slate-300">{userEmail}</td>
                      <td className="px-6 py-3.5 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="px-6 py-3.5 max-w-xs truncate text-slate-400 text-[11px]">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page {meta.page} of {meta.totalPages || 1}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(meta.page - 1)}
              disabled={meta.page <= 1}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLogs(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
