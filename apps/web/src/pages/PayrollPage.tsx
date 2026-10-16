import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Printer,
  X,
  TrendingUp,
  Receipt,
  User,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  PayrollStatus,
  UserRole,
  Permission,
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
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PayrollPage: React.FC = () => {
  const { user, can } = useAuth();
  const isHRorAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.HR;
  const isManager = user?.role === UserRole.MANAGER;

  const [records, setRecords] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Payslip Modal
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  // Create Payroll Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [formMonth, setFormMonth] = useState<number>(new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [basicSalary, setBasicSalary] = useState<number>(50000);
  const [hra, setHra] = useState<number>(20000);
  const [allowances, setAllowances] = useState<number>(5000);
  const [deductions, setDeductions] = useState<number>(3000);
  const [payrollStatus, setPayrollStatus] = useState<PayrollStatus>(PayrollStatus.PROCESSED);
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live calculation preview
  const previewGross = Math.round((Number(basicSalary) + Number(hra) + Number(allowances)) * 100) / 100;
  const previewNet = Math.max(0, Math.round((previewGross - Number(deductions)) * 100) / 100);

  const loadData = useCallback(async () => {
    if (isManager) return; // Manager has no payroll access
    setIsLoading(true);
    setFeedback(null);
    try {
      const recordsRes = await apiRequest<any[]>('/payroll');
      if (recordsRes.data) {
        setRecords(recordsRes.data);
      }

      if (isHRorAdmin) {
        const [metricsRes, empRes] = await Promise.all([
          apiRequest<any>('/payroll/metrics'),
          apiRequest<any[]>('/employees?limit=100'),
        ]);
        if (metricsRes.data) setMetrics(metricsRes.data);
        if (empRes.data) {
          setEmployees(empRes.data);
          if (empRes.data.length > 0 && !selectedEmployeeId) {
            setSelectedEmployeeId(empRes.data[0]._id);
          }
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load payroll records' });
    } finally {
      setIsLoading(false);
    }
  }, [isHRorAdmin, isManager, selectedEmployeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setFormError('Please select an employee');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await apiRequest('/payroll', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          month: Number(formMonth),
          year: Number(formYear),
          basicSalary: Number(basicSalary),
          hra: Number(hra),
          allowances: Number(allowances),
          deductions: Number(deductions),
          status: payrollStatus,
          notes: notes || undefined,
        }),
      });

      setIsCreateModalOpen(false);
      setNotes('');
      setFeedback({ type: 'success', message: 'Payroll record created successfully!' });
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to generate payroll record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await apiRequest(`/payroll/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: PayrollStatus.PAID }),
      });
      setFeedback({ type: 'success', message: 'Payroll marked as PAID' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update payroll status' });
    }
  };

  const getStatusBadge = (status: PayrollStatus) => {
    switch (status) {
      case PayrollStatus.PAID:
        return <Badge variant="success">Paid</Badge>;
      case PayrollStatus.PROCESSED:
        return <Badge variant="primary">Processed</Badge>;
      case PayrollStatus.DRAFT:
        return <Badge variant="warning">Draft</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (isManager) {
    return (
      <Card className="max-w-lg mx-auto text-center p-8 space-y-4 border-tertiary/30">
        <div className="w-12 h-12 rounded-xl bg-tertiary/20 text-tertiary mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-text-muted">
          The Manager role does not possess permissions to view or manage enterprise payroll records.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Non-Statutory Notice */}
      <div className="p-4 rounded-2xl bg-tertiary/10 border border-tertiary/30 text-tertiary-light text-xs flex items-start gap-3 backdrop-blur-md">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-tertiary" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[10px] text-tertiary">
            Management Simulation — Non-Statutory Notice
          </p>
          <p className="mt-0.5 leading-relaxed text-text-secondary text-xs">
            This module manages internal compensation schedules and verified server-side gross/net calculations. It does not calculate statutory tax filings or state compliance deductions (e.g. TDS, PF, ESI, FICA).
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Disbursement Engine
            </span>
            <span className="text-xs text-text-muted">Multi-currency & Breakdown</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {isHRorAdmin ? 'Payroll & Compensation' : 'My Payslips'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isHRorAdmin
              ? 'Manage monthly cycles, gross & net computations, and printable payslip generation'
              : 'Inspect and download your monthly compensation breakdowns and official payslips'}
          </p>
        </div>

        {isHRorAdmin && (
          <Button
            id="btn-create-payroll"
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="shadow-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Payroll Record
          </Button>
        )}
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
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-error" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Executive StatCards (HR / Admin) */}
      {isHRorAdmin && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Paid Spend"
            value={`₹${metrics.totalSpend.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5 text-secondary" />}
            subtitle="Disbursed YTD"
            iconColor="secondary"
          />
          <StatCard
            title="Disbursed Cycles"
            value={metrics.paidCount}
            icon={<CheckCircle className="w-5 h-5 text-secondary" />}
            subtitle="Completed disbursements"
            iconColor="secondary"
          />
          <StatCard
            title="Pending Disbursement"
            value={metrics.processedCount}
            icon={<Clock className="w-5 h-5 text-tertiary" />}
            subtitle="Ready for payout"
            iconColor="tertiary"
          />
          <StatCard
            title="Draft Cycles"
            value={metrics.draftCount}
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            subtitle="Internal reviews"
            iconColor="primary"
          />
        </div>
      )}

      {/* Master Payroll Records Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                {isHRorAdmin ? 'Master Payroll Records' : 'My Compensation Records'}
              </CardTitle>
              <CardDescription>
                Detailed itemized salary ledger with server-side computational verification
              </CardDescription>
            </div>
            <span className="text-xs text-text-muted font-mono">{records.length} records</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-text-muted font-mono uppercase text-[11px]">
                  {isHRorAdmin && <th className="py-3.5 px-5">Employee</th>}
                  <th className="py-3.5 px-5">Period</th>
                  <th className="py-3.5 px-5">Basic</th>
                  <th className="py-3.5 px-5">HRA</th>
                  <th className="py-3.5 px-5">Allowances</th>
                  <th className="py-3.5 px-5">Deductions</th>
                  <th className="py-3.5 px-5">Gross</th>
                  <th className="py-3.5 px-5 font-bold text-white">Net Pay</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-text-muted font-mono">
                      Loading payroll records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-text-muted">
                      No payroll records found for this period.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                      {isHRorAdmin && (
                        <td className="py-3.5 px-5 font-bold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light font-bold text-[10px]">
                              {r.employeeId?.firstName?.[0] || 'E'}
                            </div>
                            <div>
                              <span>{r.employeeId?.firstName} {r.employeeId?.lastName}</span>
                              <span className="block text-[10px] text-text-muted font-mono">
                                {r.employeeId?.employeeCode || 'EMP'}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-3.5 px-5 font-medium text-text-secondary">
                        {MONTH_NAMES[r.month - 1]} {r.year}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-text-secondary">₹{r.basicSalary.toLocaleString()}</td>
                      <td className="py-3.5 px-5 font-mono text-text-secondary">₹{r.hra.toLocaleString()}</td>
                      <td className="py-3.5 px-5 font-mono text-text-secondary">₹{r.allowances.toLocaleString()}</td>
                      <td className="py-3.5 px-5 font-mono text-error-light font-semibold">-₹{r.deductions.toLocaleString()}</td>
                      <td className="py-3.5 px-5 font-mono text-text-primary font-bold">₹{r.grossSalary.toLocaleString()}</td>
                      <td className="py-3.5 px-5 font-mono text-secondary font-black text-sm tnum">
                        ₹{r.netSalary.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            id={`btn-view-payslip-${r._id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayslip(r)}
                          >
                            <FileText className="w-3.5 h-3.5 mr-1 text-primary" />
                            Payslip
                          </Button>
                          {isHRorAdmin && r.status === PayrollStatus.PROCESSED && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleMarkAsPaid(r._id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stitch Official Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl border border-white/[0.12] w-full max-w-2xl bg-surface-darker shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    HRX ENTERPRISE PLATFORM
                  </span>
                  <Badge variant="success">Official Record</Badge>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">Salary Payslip Statement</h2>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  Disbursement Period: {MONTH_NAMES[selectedPayslip.month - 1]} {selectedPayslip.year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  title="Print Payslip"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print
                </Button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/[0.05] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Non-Statutory Disclaimer */}
            <div className="p-3 rounded-xl bg-tertiary/10 border border-tertiary/20 text-[11px] text-tertiary-light">
              Notice: This payslip is compiled for internal corporate management and compensation disbursement purposes.
            </div>

            {/* Employee Information Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-highest/40 border border-white/[0.06] text-xs">
              <div>
                <p className="text-text-muted">Employee Name</p>
                <p className="font-bold text-white mt-0.5 text-sm">
                  {selectedPayslip.employeeId?.firstName} {selectedPayslip.employeeId?.lastName || user?.email}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Employee Code</p>
                <p className="font-bold text-primary-light font-mono mt-0.5 text-sm">
                  {selectedPayslip.employeeId?.employeeCode || 'EMP-SARAH'}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Department & Position</p>
                <p className="font-semibold text-text-secondary mt-0.5">
                  {selectedPayslip.employeeId?.position || 'Software Engineer'}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Disbursement Status</p>
                <p className="font-bold text-secondary font-mono mt-0.5 uppercase tracking-wider text-xs">
                  {selectedPayslip.status}
                </p>
              </div>
            </div>

            {/* Salary Breakdown Columns (Earnings vs Deductions) */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="space-y-3 p-4 rounded-xl bg-surface-container/60 border border-white/[0.04]">
                <h4 className="font-bold text-primary-light uppercase tracking-wider text-[11px] border-b border-white/[0.08] pb-1.5 flex items-center justify-between">
                  <span>Earnings</span>
                  <span className="font-mono text-[10px] text-text-muted">Amount</span>
                </h4>
                <div className="flex justify-between text-text-secondary">
                  <span>Basic Salary</span>
                  <span className="font-mono text-white font-semibold">₹{selectedPayslip.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono text-white font-semibold">₹{selectedPayslip.hra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Special & Other Allowances</span>
                  <span className="font-mono text-white font-semibold">₹{selectedPayslip.allowances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2.5 border-t border-white/[0.08]">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-primary font-bold">₹{selectedPayslip.grossSalary.toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-3 p-4 rounded-xl bg-surface-container/60 border border-white/[0.04]">
                <h4 className="font-bold text-error-light uppercase tracking-wider text-[11px] border-b border-white/[0.08] pb-1.5 flex items-center justify-between">
                  <span>Deductions</span>
                  <span className="font-mono text-[10px] text-text-muted">Amount</span>
                </h4>
                <div className="flex justify-between text-text-secondary">
                  <span>Internal Adjustments / Deductions</span>
                  <span className="font-mono text-error font-semibold">₹{selectedPayslip.deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Leave Without Pay (LWP)</span>
                  <span className="font-mono text-text-muted font-semibold">₹0</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2.5 border-t border-white/[0.08]">
                  <span>Total Deductions</span>
                  <span className="font-mono text-error font-bold">₹{selectedPayslip.deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight Hero */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-surface-highest to-surface-container border border-secondary/30 flex items-center justify-between shadow-glass">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-secondary font-bold">
                  Net Payable Total
                </span>
                <p className="text-xs text-text-muted mt-0.5">Final credited amount (Gross less Total Deductions)</p>
              </div>
              <h3 className="text-3xl font-black text-secondary font-mono tracking-tight tnum">
                ₹{selectedPayslip.netSalary.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Create Payroll Modal (HR / Admin) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate Payroll Record"
        description="Compute compensation, allowances, and deductions for an employee cycle."
        maxWidth="lg"
      >
        {formError && (
          <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error-light text-xs mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreatePayroll} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Select Personnel *
            </label>
            <select
              id="select-payroll-employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id} className="bg-surface-darker text-white">
                  {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.position || 'Staff'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Cycle Month *</label>
              <select
                id="select-payroll-month"
                value={formMonth}
                onChange={(e) => setFormMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={i + 1} className="bg-surface-darker text-white">
                    {name} ({i + 1})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Cycle Year *</label>
              <input
                id="input-payroll-year"
                type="number"
                value={formYear}
                onChange={(e) => setFormYear(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Basic Salary (₹) *</label>
              <input
                id="input-basic-salary"
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">HRA (₹) *</label>
              <input
                id="input-hra"
                type="number"
                value={hra}
                onChange={(e) => setHra(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Allowances (₹)</label>
              <input
                id="input-allowances"
                type="number"
                value={allowances}
                onChange={(e) => setAllowances(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Deductions (₹)</label>
              <input
                id="input-deductions"
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Live Calculation Preview Banner */}
          <div className="p-4 rounded-xl bg-surface-highest/60 border border-white/[0.08] flex items-center justify-between text-xs">
            <div>
              <span className="text-text-muted">Computed Gross:</span>{' '}
              <span className="font-mono text-white font-bold text-sm">₹{previewGross.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-text-muted">Net Disbursable:</span>{' '}
              <span className="font-mono text-secondary font-black text-sm">₹{previewNet.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Record Status</label>
            <select
              id="select-payroll-status"
              value={payrollStatus}
              onChange={(e) => setPayrollStatus(e.target.value as PayrollStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
            >
              <option value={PayrollStatus.DRAFT} className="bg-surface-darker text-white">Draft (Internal audit)</option>
              <option value={PayrollStatus.PROCESSED} className="bg-surface-darker text-white">Processed (Notify employee)</option>
              <option value={PayrollStatus.PAID} className="bg-surface-darker text-white">Paid (Disbursed)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="btn-submit-payroll"
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Generating...' : 'Save & Issue Payroll'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

