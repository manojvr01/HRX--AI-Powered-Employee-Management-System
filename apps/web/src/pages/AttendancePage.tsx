import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Timer,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { IAttendance, AttendanceStatus, UserRole } from '@hrx/shared';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState<{
    presentDays: number;
    lateDays: number;
    halfDays: number;
    totalMinutesWorked: number;
    totalHoursWorked: string;
  } | null>(null);
  const [todayRecord, setTodayRecord] = useState<IAttendance | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Live digital clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Load history
      const historyRes = await apiRequest<any[]>('/attendance');
      if (historyRes.data) {
        setHistory(historyRes.data);
        const foundToday = historyRes.data.find((rec: any) => {
          const recDate = typeof rec.date === 'string' ? rec.date.split('T')[0] : '';
          const recEmpId = rec.employeeId?._id || rec.employeeId;
          const userEmpId = user?.employee?.id;
          return recDate === todayStr && (!userEmpId || recEmpId === userEmpId);
        });
        setTodayRecord(foundToday || null);
      }

      // Load summary
      const summaryRes = await apiRequest<{
        presentDays: number;
        lateDays: number;
        halfDays: number;
        totalMinutesWorked: number;
        totalHoursWorked: string;
      }>('/attendance/summary');
      if (summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  }, [user?.employee?.id]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiRequest<IAttendance>('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ notes: notes || undefined }),
      });
      if (res.data) {
        setSuccess('Check-in successful!');
        setNotes('');
        await loadAttendanceData();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to check in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiRequest<IAttendance>('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ notes: notes || undefined }),
      });
      if (res.data) {
        setSuccess('Check-out successful!');
        setNotes('');
        await loadAttendanceData();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to check out');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case AttendanceStatus.LATE:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case AttendanceStatus.HALF_DAY:
        return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
      case AttendanceStatus.ABSENT:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const isCheckedIn = Boolean(todayRecord?.checkInTime);
  const isCheckedOut = Boolean(todayRecord?.checkOutTime);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Attendance Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time daily check-in, tracking, duration calculation, and monthly summaries
          </p>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Today's Check-in / Check-out Punch Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Clock & Today status */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs uppercase font-mono text-slate-400 tracking-wider">Current Time</p>
              <h2 className="text-3xl font-black text-white font-mono mt-0.5">{currentTime}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Today's Punch State Details */}
          <div className="space-y-2 border-y lg:border-y-0 lg:border-x border-slate-800 py-4 lg:py-0 lg:px-6">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Check-in:</span>
              <span className="font-semibold text-white font-mono">
                {todayRecord?.checkInTime
                  ? new Date(todayRecord.checkInTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Not checked in'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Check-out:</span>
              <span className="font-semibold text-white font-mono">
                {todayRecord?.checkOutTime
                  ? new Date(todayRecord.checkOutTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Not checked out'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Status:</span>
              {todayRecord?.status ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                    todayRecord.status
                  )}`}
                >
                  {todayRecord.status}
                </span>
              ) : (
                <span className="text-slate-500">PENDING</span>
              )}
            </div>
            {todayRecord?.durationMinutes !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Working Duration:</span>
                <span className="font-semibold text-indigo-400 font-mono">
                  {Math.floor(todayRecord.durationMinutes / 60)}h {todayRecord.durationMinutes % 60}m
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Optional notes (e.g. WFH, client visit)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-3">
              <button
                id="btn-checkin"
                onClick={handleCheckIn}
                disabled={isCheckedIn || isSubmitting}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  isCheckedIn
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                }`}
              >
                <LogIn className="w-4 h-4" />
                {isCheckedIn ? 'Checked In' : 'Check In'}
              </button>

              <button
                id="btn-checkout"
                onClick={handleCheckOut}
                disabled={!isCheckedIn || isCheckedOut || isSubmitting}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  !isCheckedIn || isCheckedOut
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                }`}
              >
                <LogOut className="w-4 h-4" />
                {isCheckedOut ? 'Checked Out' : 'Check Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Days Present</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{summary.presentDays}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Late Days</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{summary.lateDays}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Half Days</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{summary.halfDays}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Hours</p>
              <h3 className="text-2xl font-black text-white mt-0.5">{summary.totalHoursWorked} hrs</h3>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Attendance History</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{history.length} records found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 font-mono uppercase text-[11px]">
                {user?.role !== UserRole.EMPLOYEE && <th className="py-3 px-4">Employee</th>}
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 font-mono text-xs"
                  >
                    Loading attendance records...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition">
                    {user?.role !== UserRole.EMPLOYEE && (
                      <td className="py-3 px-4 font-medium text-white">
                        {item.employeeId?.firstName
                          ? `${item.employeeId.firstName} ${item.employeeId.lastName} (${item.employeeId.employeeCode})`
                          : 'You'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {typeof item.date === 'string' ? item.date.split('T')[0] : item.date}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {item.checkInTime
                        ? new Date(item.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {item.checkOutTime
                        ? new Date(item.checkOutTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-400">
                      {item.durationMinutes !== undefined
                        ? `${Math.floor(item.durationMinutes / 60)}h ${
                            item.durationMinutes % 60
                          }m`
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
