import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Check,
  X,
  FileText,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  ILeaveType,
  ILeaveBalance,
  LeaveRequestStatus,
  Permission,
} from '@hrx/shared';

export const LeavePage: React.FC = () => {
  const { user, can } = useAuth();
  const [activeTab, setActiveTab] = useState<'my' | 'approvals' | 'calendar'>('my');
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<ILeaveType[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Form states
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canApprove = can(Permission.LEAVE_APPROVE);

  const loadLeaveData = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      // Load types
      const typesRes = await apiRequest<ILeaveType[]>('/leave/types');
      if (typesRes.data) {
        setLeaveTypes(typesRes.data);
        if (typesRes.data.length > 0 && !selectedLeaveType) {
          setSelectedLeaveType(typesRes.data[0]._id);
        }
      }

      // Load balances
      const balRes = await apiRequest<ILeaveBalance[]>('/leave/balances');
      if (balRes.data) {
        setBalances(balRes.data);
      }

      // Load requests
      const reqRes = await apiRequest<any[]>('/leave/requests');
      if (reqRes.data) {
        setAllLeaves(reqRes.data);
        const myEmpId = user?.employee?.id;
        const my = reqRes.data.filter((r: any) => {
          const empId = r.employeeId?._id || r.employeeId;
          return !myEmpId || empId === myEmpId;
        });
        setMyRequests(my);

        if (canApprove) {
          const pending = reqRes.data.filter((r: any) => r.status === LeaveRequestStatus.PENDING);
          setPendingApprovals(pending);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load leave data' });
    } finally {
      setIsLoading(false);
    }
  }, [canApprove, selectedLeaveType, user?.employee?.id]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveType || !startDate || !endDate || !reason.trim()) {
      setFormError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await apiRequest('/leave', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: selectedLeaveType,
          startDate,
          endDate,
          reason,
        }),
      });

      setIsApplyModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setFeedback({ type: 'success', message: 'Leave application submitted successfully!' });
      await loadLeaveData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to apply for leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    try {
      await apiRequest(`/leave/${id}/cancel`, { method: 'PATCH' });
      setFeedback({ type: 'success', message: 'Leave request cancelled' });
      await loadLeaveData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to cancel request' });
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      await apiRequest(`/leave/${id}/approve`, { method: 'PATCH' });
      setFeedback({ type: 'success', message: 'Leave request approved successfully!' });
      await loadLeaveData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to approve request' });
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingLeaveId(id);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingLeaveId) return;
    try {
      await apiRequest(`/leave/${rejectingLeaveId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason }),
      });
      setIsRejectModalOpen(false);
      setRejectingLeaveId(null);
      setFeedback({ type: 'success', message: 'Leave request rejected' });
      await loadLeaveData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to reject request' });
    }
  };

  const getStatusBadge = (status: LeaveRequestStatus) => {
    switch (status) {
      case LeaveRequestStatus.APPROVED:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case LeaveRequestStatus.PENDING:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case LeaveRequestStatus.REJECTED:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case LeaveRequestStatus.CANCELLED:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Leave Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Apply, track balances, holiday exclusions, and review team approvals
          </p>
        </div>
        <button
          id="btn-apply-leave"
          onClick={() => setIsApplyModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Global Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {balances.map((b) => (
          <div
            key={b._id}
            className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {b.leaveTypeId?.name || 'Leave'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{b.year}</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{b.remainingDays}</span>
                <span className="text-xs text-slate-400">days remaining</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Allocated: {b.allocatedDays}</span>
              <span>Used: {b.usedDays}</span>
              <span>Pending: {b.pendingDays}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'my'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          My Requests ({myRequests.length})
        </button>
        {canApprove && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Approvals
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Calendar Overview
        </button>
      </div>

      {/* Tab 1: My Requests */}
      {activeTab === 'my' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                      Loading your leave applications...
                    </td>
                  </tr>
                ) : myRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      No leave applications found.
                    </td>
                  </tr>
                ) : (
                  myRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {r.leaveTypeId?.name || 'Leave'}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400">
                        {r.daysCount} working {r.daysCount === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {r.startDate} <span className="text-slate-500">→</span> {r.endDate}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === LeaveRequestStatus.PENDING && (
                          <button
                            onClick={() => handleCancelLeave(r._id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Approvals (HR / Manager) */}
      {activeTab === 'approvals' && canApprove && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Date Range</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      No pending leave requests requiring approval.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {r.employeeId?.firstName} {r.employeeId?.lastName} (
                        {r.employeeId?.employeeCode})
                      </td>
                      <td className="py-3 px-4 text-indigo-400 font-semibold">
                        {r.leaveTypeId?.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {r.daysCount} days
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {r.startDate} → {r.endDate}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            id={`btn-approve-leave-${r._id}`}
                            onClick={() => handleApproveLeave(r._id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            id={`btn-reject-leave-${r._id}`}
                            onClick={() => openRejectModal(r._id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center gap-1 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Calendar View */}
      {activeTab === 'calendar' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Upcoming & Scheduled Leaves</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allLeaves
              .filter((l) => l.status === LeaveRequestStatus.APPROVED)
              .map((l) => (
                <div
                  key={l._id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {l.employeeId?.firstName
                        ? `${l.employeeId.firstName} ${l.employeeId.lastName}`
                        : 'Employee'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      APPROVED
                    </span>
                  </div>
                  <p className="text-xs text-indigo-400 font-medium">
                    {l.leaveTypeId?.name} ({l.daysCount} days)
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {l.startDate} to {l.endDate}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-800 w-full max-w-lg p-6 bg-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Apply for Leave</h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Leave Type *
                </label>
                <select
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {leaveTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.daysAllowedPerYear} days/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    id="input-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    id="input-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Leave *
                </label>
                <textarea
                  id="input-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detail your request reason..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  Weekends and official organization holidays are automatically excluded from the
                  working days deduction.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-leave"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-800 w-full max-w-md p-6 bg-slate-900 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Reject Leave Request</h3>
            <p className="text-xs text-slate-400">
              Provide an explanation for rejecting this leave application:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Critical project sprint milestone..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-leave"
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
