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
  Sparkles,
  Users,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  ILeaveType,
  ILeaveBalance,
  LeaveRequestStatus,
  Permission,
  UserRole,
} from '@hrx/shared';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const LeavePage: React.FC = () => {
  const { user, can } = useAuth();
  const isApproverRole =
    user?.role === UserRole.ADMIN || user?.role === UserRole.HR || user?.role === UserRole.MANAGER;
  const canApprove = can(Permission.LEAVE_APPROVE) || isApproverRole;

  // Default to approvals for HR & Admin
  const [activeTab, setActiveTab] = useState<'my' | 'approvals' | 'history' | 'calendar'>(
    user?.role === UserRole.ADMIN || user?.role === UserRole.HR ? 'approvals' : 'my'
  );
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
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Form states
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        const my = myEmpId
          ? reqRes.data.filter((r: any) => {
              const empId = r.employeeId?._id ? String(r.employeeId._id) : String(r.employeeId);
              return empId === String(myEmpId);
            })
          : [];
        setMyRequests(my);

        if (canApprove) {
          const pending = reqRes.data.filter(
            (r: any) => r.status === LeaveRequestStatus.PENDING && r.employeeId
          );
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
    setActionInProgressId(id);
    try {
      await apiRequest(`/leave/${id}/cancel`, { method: 'PATCH' });
      setFeedback({ type: 'success', message: 'Leave request cancelled' });
      await loadLeaveData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to cancel request' });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleApproveLeave = async (id: string) => {
    setActionInProgressId(id);
    setFeedback(null);
    try {
      await apiRequest(`/leave/${id}/approve`, { method: 'PATCH' });
      setFeedback({ type: 'success', message: 'Leave request approved successfully!' });
      await loadLeaveData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to approve request' });
    } finally {
      setActionInProgressId(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingLeaveId(id);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingLeaveId) return;
    setActionInProgressId(rejectingLeaveId);
    setFeedback(null);
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
    } finally {
      setActionInProgressId(null);
    }
  };

  const getStatusBadge = (status: LeaveRequestStatus) => {
    switch (status) {
      case LeaveRequestStatus.APPROVED:
        return <Badge variant="success">Approved</Badge>;
      case LeaveRequestStatus.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case LeaveRequestStatus.REJECTED:
        return <Badge variant="danger">Rejected</Badge>;
      case LeaveRequestStatus.CANCELLED:
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Absence & PTO System
            </span>
            <span className="text-xs text-text-muted">Fiscal Year 2026</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Leave & PTO Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time quota tracking, holiday exclusions, team conflict checks, and rapid approvals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            id="btn-apply-leave"
            onClick={() => setIsApplyModalOpen(true)}
            variant="primary"
            className="shadow-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border shadow-glass transition-all ${
            feedback.type === 'success'
              ? 'bg-secondary/10 border-secondary/30 text-secondary-light'
              : 'bg-error/10 border-error/30 text-error-light'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-error" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Pending Approvals Alert Banner for Approvers */}
      {canApprove && pendingApprovals.length > 0 && activeTab !== 'approvals' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-tertiary/15 via-surface-container to-surface-container border border-tertiary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-glass backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-tertiary/20 border border-tertiary/40 flex items-center justify-center flex-shrink-0 text-tertiary shadow-glow">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span>{pendingApprovals.length} Leave {pendingApprovals.length === 1 ? 'Request' : 'Requests'} Awaiting Review</span>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-tertiary text-slate-950 uppercase tracking-wider">
                  Action Required
                </span>
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Team members are waiting for your approval. Check team coverage and decide immediately.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setActiveTab('approvals')}
            variant="copilot"
            size="sm"
            className="whitespace-nowrap self-start sm:self-auto font-bold"
          >
            Review Approvals ({pendingApprovals.length})
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Leave Balances Grid (Stitch Quota Cards with Progress Gauges) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Your Annual Entitlements & Balances
          </h2>
          <span className="text-[11px] text-text-muted font-mono">Auto-adjusted for holidays & weekends</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.length === 0 && !isLoading ? (
            <div className="col-span-full p-6 text-center text-text-muted text-xs glass-card">
              No leave quotas assigned yet for this profile.
            </div>
          ) : (
            balances.map((b) => {
              const allocated = b.allocatedDays || 1;
              const used = b.usedDays || 0;
              const remaining = b.remainingDays !== undefined ? b.remainingDays : allocated - used;
              const percentUsed = Math.min(100, Math.round((used / allocated) * 100));

              return (
                <div
                  key={b._id}
                  className="glass-card p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden group hover:border-primary/40 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-light">
                      {b.leaveTypeId?.name || 'Leave Quota'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-text-muted border border-white/[0.06]">
                      FY {b.year || '2026'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-3xl font-black text-white tracking-tight tnum">{remaining}</span>
                      <span className="text-xs text-text-muted ml-1.5 font-medium">days left</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-text-secondary">
                      {b.allocatedDays} max
                    </span>
                  </div>

                  {/* Progress Gauge */}
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-surface-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-1">
                      <span>Used: <strong className="text-text-secondary">{b.usedDays || 0}</strong></span>
                      <span>Pending: <strong className="text-tertiary-light">{b.pendingDays || 0}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stitch Tab Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
        {canApprove && (
          <button
            id="tab-approvals"
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-primary text-white shadow-glow'
                : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-tertiary text-slate-950 text-[10px] font-black">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}
        <button
          id="tab-my-requests"
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'my'
              ? 'bg-primary text-white shadow-glow'
              : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          My Requests ({myRequests.length})
        </button>
        {canApprove && (
          <button
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-primary text-white shadow-glow'
                : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            All Organization Requests ({allLeaves.length})
          </button>
        )}
        <button
          id="tab-calendar"
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'bg-primary text-white shadow-glow'
              : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Upcoming Schedule
        </button>
      </div>

      {/* Tab 1: My Requests */}
      {activeTab === 'my' && (
        <Card>
          <CardHeader>
            <CardTitle>My Leave History</CardTitle>
            <CardDescription>
              Status and details of your submitted personal leave applications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-text-muted font-mono uppercase text-[11px]">
                    <th className="py-3.5 px-5">Leave Type</th>
                    <th className="py-3.5 px-5">Working Days</th>
                    <th className="py-3.5 px-5">Date Span</th>
                    <th className="py-3.5 px-5">Reason</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted font-mono">
                        Loading your leave applications...
                      </td>
                    </tr>
                  ) : myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-text-secondary">No personal leave applications submitted.</p>
                          {canApprove && pendingApprovals.length > 0 && (
                            <button
                              onClick={() => setActiveTab('approvals')}
                              className="text-primary hover:text-primary-light font-semibold underline text-xs transition"
                            >
                              View {pendingApprovals.length} team leave request(s) awaiting approval →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((r) => (
                      <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-5 font-bold text-white">
                          {r.leaveTypeId?.name || 'Leave'}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-primary-light font-bold">
                          {r.daysCount} {r.daysCount === 1 ? 'day' : 'days'}
                        </td>
                        <td className="py-3.5 px-5 text-text-secondary font-mono">
                          {r.startDate} <span className="text-text-muted">→</span> {r.endDate}
                        </td>
                        <td className="py-3.5 px-5 text-text-muted max-w-xs truncate">{r.reason}</td>
                        <td className="py-3.5 px-5">{getStatusBadge(r.status)}</td>
                        <td className="py-3.5 px-5 text-right">
                          {r.status === LeaveRequestStatus.PENDING && (
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={actionInProgressId === r._id}
                              onClick={() => handleCancelLeave(r._id)}
                            >
                              {actionInProgressId === r._id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Approvals (HR / Manager / Admin) */}
      {activeTab === 'approvals' && canApprove && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-tertiary" />
                  Pending Approvals Queue
                </CardTitle>
                <CardDescription>
                  Review employee leave requests with automated conflict and balance analysis
                </CardDescription>
              </div>
              <Badge variant="warning">{pendingApprovals.length} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-text-muted font-mono uppercase text-[11px]">
                    <th className="py-3.5 px-5">Employee</th>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Working Days</th>
                    <th className="py-3.5 px-5">Date Range</th>
                    <th className="py-3.5 px-5">Reason</th>
                    <th className="py-3.5 px-5 text-right">Decisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {pendingApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-text-muted">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle className="w-9 h-9 text-secondary/60 mb-1" />
                          <p className="font-bold text-white text-sm">Approvals Queue is Clear!</p>
                          <p className="text-text-muted">No pending leave requests requiring review.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingApprovals.map((r) => {
                      const emp = r.employeeId;
                      const empName = emp?.firstName
                        ? `${emp.firstName} ${emp.lastName}`
                        : emp?.email || 'Unknown Employee';
                      const empCode = emp?.employeeCode || 'EMP';
                      const isActing = actionInProgressId === r._id;

                      return (
                        <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light font-bold text-xs uppercase flex-shrink-0">
                                {empName.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-white">{empName}</p>
                                <p className="text-[11px] text-text-muted font-mono">
                                  {empCode} {emp?.position ? `• ${emp.position}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="text-primary-light font-bold">
                              {r.leaveTypeId?.name || 'Leave'}
                            </span>
                            {r.leaveTypeId?.isPaid !== undefined && (
                              <span className="block text-[10px] text-text-muted font-mono">
                                {r.leaveTypeId.isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-white font-bold">
                            {r.daysCount} {r.daysCount === 1 ? 'day' : 'days'}
                          </td>
                          <td className="py-3.5 px-5 text-text-secondary font-mono">
                            {r.startDate} <span className="text-text-muted">→</span> {r.endDate}
                          </td>
                          <td className="py-3.5 px-5 text-text-muted max-w-xs">
                            <p className="truncate" title={r.reason}>
                              {r.reason || 'No reason provided'}
                            </p>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button
                                id={`btn-approve-leave-${r._id}`}
                                variant="secondary"
                                size="sm"
                                disabled={isActing}
                                onClick={() => handleApproveLeave(r._id)}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                {isActing ? 'Processing...' : 'Approve'}
                              </Button>
                              <Button
                                id={`btn-reject-leave-${r._id}`}
                                variant="danger"
                                size="sm"
                                disabled={isActing}
                                onClick={() => openRejectModal(r._id)}
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Company Leave History (HR / Admin) */}
      {activeTab === 'history' && canApprove && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Company Leave Records</CardTitle>
                <CardDescription>
                  Comprehensive log of all submitted, approved, and rejected leaves
                </CardDescription>
              </div>
              <Badge variant="neutral">{allLeaves.length} Total Records</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-text-muted font-mono uppercase text-[11px]">
                    <th className="py-3.5 px-5">Employee</th>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Days</th>
                    <th className="py-3.5 px-5">Dates</th>
                    <th className="py-3.5 px-5">Reason</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Actioned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {allLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-muted">
                        No leave records recorded in the company.
                      </td>
                    </tr>
                  ) : (
                    allLeaves.map((r) => {
                      const emp = r.employeeId;
                      const empName = emp?.firstName
                        ? `${emp.firstName} ${emp.lastName}`
                        : emp?.email || 'Employee';
                      return (
                        <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-5 font-bold text-white">{empName}</td>
                          <td className="py-3.5 px-5 text-primary-light font-bold">
                            {r.leaveTypeId?.name || 'Leave'}
                          </td>
                          <td className="py-3.5 px-5 font-mono text-text-secondary font-bold">
                            {r.daysCount} days
                          </td>
                          <td className="py-3.5 px-5 text-text-secondary font-mono">
                            {r.startDate} <span className="text-text-muted">→</span> {r.endDate}
                          </td>
                          <td className="py-3.5 px-5 text-text-muted max-w-xs truncate">{r.reason}</td>
                          <td className="py-3.5 px-5">{getStatusBadge(r.status)}</td>
                          <td className="py-3.5 px-5 text-text-muted font-mono text-[11px]">
                            {r.approverId?.email || r.approverId?.role || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Calendar View */}
      {activeTab === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Scheduled Team Absences
            </CardTitle>
            <CardDescription>
              Upcoming approved leaves across departments to help plan sprint capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allLeaves
                .filter((l) => l.status === LeaveRequestStatus.APPROVED)
                .map((l) => (
                  <div
                    key={l._id}
                    className="p-4 rounded-xl bg-surface-highest/40 border border-white/[0.06] space-y-2 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {l.employeeId?.firstName
                          ? `${l.employeeId.firstName} ${l.employeeId.lastName}`
                          : 'Employee'}
                      </span>
                      <Badge variant="success">Approved</Badge>
                    </div>
                    <p className="text-xs text-primary-light font-medium">
                      {l.leaveTypeId?.name} ({l.daysCount} working days)
                    </p>
                    <p className="text-xs text-text-muted font-mono">
                      {l.startDate} to {l.endDate}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        description="Submit your planned time off. Official company holidays and weekends are automatically omitted."
        maxWidth="lg"
      >
        {formError && (
          <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error-light text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-error" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Leave Quota Category *
            </label>
            <select
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
            >
              {leaveTypes.map((t) => (
                <option key={t._id} value={t._id} className="bg-surface-darker text-white">
                  {t.name} ({t.daysAllowedPerYear} days / fiscal year)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Start Date *
              </label>
              <input
                id="input-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary font-mono transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                End Date *
              </label>
              <input
                id="input-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary font-mono transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Reason / Coverage Note *
            </label>
            <textarea
              id="input-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason for absence and who is covering key tasks..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary-light flex items-center gap-2.5">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Weekends and official organization holidays are automatically excluded from the calculated working days deduction.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="btn-submit-leave"
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Leave Request"
        description="Provide a constructive reason for rejecting this leave application to inform the employee."
        maxWidth="md"
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Milestone sprint deadline requires key coverage..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white placeholder-text-muted focus:outline-none focus:border-error transition"
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="btn-confirm-reject-leave"
              type="button"
              variant="danger"
              onClick={handleConfirmReject}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

