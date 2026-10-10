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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  PayrollStatus,
  UserRole,
  Permission,
} from '@hrx/shared';

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

  if (isManager) {
    return (
      <div className="p-8 glass-panel rounded-2xl max-w-lg mx-auto text-center space-y-4 border border-amber-500/30">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400">
          The Manager role does not possess permissions to view or manage enterprise payroll records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Non-Statutory Prominent Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[11px]">
            Management Demo Module — Non-Statutory Notice
          </p>
          <p className="mt-0.5 leading-relaxed text-amber-300/90">
            This payroll simulation demonstrates internal enterprise compensation workflows and server-side gross/net calculations. It does not calculate statutory tax withholdings or compliance filings (e.g. TDS, PF, ESI, FICA).
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {isHRorAdmin ? 'Payroll & Compensation' : 'My Payslips'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isHRorAdmin
              ? 'Manage monthly compensation cycles, gross & net computations, and payslip generation'
              : 'View and download your monthly compensation breakdowns and payslips'}
          </p>
        </div>

        {isHRorAdmin && (
          <button
            id="btn-create-payroll"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Payroll Record
          </button>
        )}
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
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Dashboard Stats (HR / Admin) */}
      {isHRorAdmin && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Paid Spend</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-black text-white font-mono">
              ₹{metrics.totalSpend.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500">Across all disbursed payrolls</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Disbursed (Paid)</span>
              <CheckCircle className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white">{metrics.paidCount}</h3>
            <p className="text-[11px] text-slate-500">Completed salary cycles</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Processed (Pending Pay)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-2xl font-black text-white">{metrics.processedCount}</h3>
            <p className="text-[11px] text-slate-500">Ready for disbursement</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Draft Cycles</span>
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-2xl font-black text-white">{metrics.draftCount}</h3>
            <p className="text-[11px] text-slate-500">Internal drafts in review</p>
          </div>
        </div>
      )}

      {/* Payroll Records List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              {isHRorAdmin ? 'Master Payroll Records' : 'My Compensation Records'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{records.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono uppercase text-[11px]">
                {isHRorAdmin && <th className="py-3 px-4">Employee</th>}
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Basic</th>
                <th className="py-3 px-4">HRA</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Gross</th>
                <th className="py-3 px-4 font-bold text-white">Net Pay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-mono text-xs">
                    Loading payroll records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    No payroll records available.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/30 transition">
                    {isHRorAdmin && (
                      <td className="py-3 px-4 font-semibold text-white">
                        {r.employeeId?.firstName} {r.employeeId?.lastName}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {r.employeeId?.employeeCode}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {MONTH_NAMES[r.month - 1]} {r.year}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">₹{r.basicSalary.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">₹{r.hra.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">₹{r.allowances.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-rose-400">-₹{r.deductions.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-300 font-semibold">₹{r.grossSalary.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold text-sm">
                      ₹{r.netSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === PayrollStatus.PAID
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : r.status === PayrollStatus.PROCESSED
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          id={`btn-view-payslip-${r._id}`}
                          onClick={() => setSelectedPayslip(r)}
                          className="px-2.5 py-1 rounded-lg text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Payslip
                        </button>
                        {isHRorAdmin && r.status === PayrollStatus.PROCESSED && (
                          <button
                            onClick={() => handleMarkAsPaid(r._id)}
                            className="px-2.5 py-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold transition"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip View Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-800 w-full max-w-2xl bg-slate-900 shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-bold">
                  HRX ENTERPRISE PLATFORM
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">Official Payslip Record</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Period: {MONTH_NAMES[selectedPayslip.month - 1]} {selectedPayslip.year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Print Payslip"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Non-Statutory Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              Notice: This payslip is generated for internal management demonstration purposes only. It does not constitute a certified statutory tax document.
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <p className="text-slate-500">Employee Name</p>
                <p className="font-bold text-white mt-0.5">
                  {selectedPayslip.employeeId?.firstName} {selectedPayslip.employeeId?.lastName || user?.email}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Employee Code</p>
                <p className="font-bold text-white font-mono mt-0.5">
                  {selectedPayslip.employeeId?.employeeCode || 'EMP-SARAH'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Position / Designation</p>
                <p className="font-semibold text-slate-300 mt-0.5">
                  {selectedPayslip.employeeId?.position || 'Software Engineer'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Disbursement Status</p>
                <p className="font-bold text-emerald-400 font-mono mt-0.5">
                  {selectedPayslip.status}
                </p>
              </div>
            </div>

            {/* Salary Breakdown Columns */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
                  Earnings Breakdown
                </h4>
                <div className="flex justify-between text-slate-400">
                  <span>Basic Salary</span>
                  <span className="font-mono text-white">₹{selectedPayslip.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono text-white">₹{selectedPayslip.hra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Special & Other Allowances</span>
                  <span className="font-mono text-white">₹{selectedPayslip.allowances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-200 pt-2 border-t border-slate-800">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-indigo-400">₹{selectedPayslip.grossSalary.toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1">
                  Deductions Breakdown
                </h4>
                <div className="flex justify-between text-slate-400">
                  <span>Internal Deductions / Penalties</span>
                  <span className="font-mono text-rose-400">₹{selectedPayslip.deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Unpaid Leave Adjustments</span>
                  <span className="font-mono text-slate-500">₹0</span>
                </div>
                <div className="flex justify-between font-bold text-slate-200 pt-2 border-t border-slate-800">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-400">₹{selectedPayslip.deductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Total */}
            <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold">
                  Net Payable Amount
                </span>
                <p className="text-xs text-slate-400">Gross Earnings less Total Deductions</p>
              </div>
              <h3 className="text-2xl font-black text-emerald-400 font-mono">
                ₹{selectedPayslip.netSalary.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Create Payroll Modal (HR / Admin) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-800 w-full max-w-lg p-6 bg-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Generate Payroll Record</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePayroll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Employee *
                </label>
                <select
                  id="select-payroll-employee"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Month *</label>
                  <select
                    id="select-payroll-month"
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={i + 1} value={i + 1}>
                        {name} ({i + 1})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Year *</label>
                  <input
                    id="input-payroll-year"
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Basic Salary *</label>
                  <input
                    id="input-basic-salary"
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">HRA *</label>
                  <input
                    id="input-hra"
                    type="number"
                    value={hra}
                    onChange={(e) => setHra(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Allowances</label>
                  <input
                    id="input-allowances"
                    type="number"
                    value={allowances}
                    onChange={(e) => setAllowances(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deductions</label>
                  <input
                    id="input-deductions"
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Server Calculation Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Gross Salary:</span>{' '}
                  <span className="font-mono text-white font-semibold">₹{previewGross.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Computed Net:</span>{' '}
                  <span className="font-mono text-emerald-400 font-bold">₹{previewNet.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  id="select-payroll-status"
                  value={payrollStatus}
                  onChange={(e) => setPayrollStatus(e.target.value as PayrollStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={PayrollStatus.DRAFT}>Draft (Internal review)</option>
                  <option value={PayrollStatus.PROCESSED}>Processed (Notify employee)</option>
                  <option value={PayrollStatus.PAID}>Paid (Disbursed)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-payroll"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Save & Issue Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
