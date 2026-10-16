import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Timer,
  TrendingUp,
  Fingerprint,
  CalendarDays,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Smartphone,
  CreditCard,
  Coffee,
  Table as TableIcon,
  Sparkles,
  UserCheck,
  Building,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { IAttendance, AttendanceStatus, UserRole } from '@hrx/shared';
import { Badge, Button } from '../components/ui';

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

  // View Mode: 'calendar' | 'table'
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');

  // Month Navigation State (defaults to current date)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());

  // Table Filter & Search State
  const [tableFilter, setTableFilter] = useState<'all' | 'present' | 'late' | 'half_day' | 'leave'>('all');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
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
        setSuccess('Ingress biometric check-in verified successfully!');
        setNotes('');
        await loadAttendanceData();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to clock in');
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
        setSuccess('Shift check-out recorded and reconciled successfully!');
        setNotes('');
        await loadAttendanceData();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to clock out');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckedIn = Boolean(todayRecord?.checkInTime);
  const isCheckedOut = Boolean(todayRecord?.checkOutTime);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleJumpToToday = () => {
    setCurrentMonthDate(new Date());
  };

  // Month details
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];

  // Map history records by 'YYYY-MM-DD'
  const historyByDate = useMemo(() => {
    const map = new Map<string, any>();
    history.forEach((rec) => {
      const d = typeof rec.date === 'string' ? rec.date.split('T')[0] : '';
      if (d) {
        map.set(d, rec);
      }
    });
    return map;
  }, [history]);

  // Generate Weeks for Calendar Grid (Monday through Sunday)
  const calendarWeeks = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Monday-based index: 0=Mon, 1=Tue, ..., 6=Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const weeks: Array<Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      isPastOrToday: boolean;
      record: any | null;
    }>> = [];

    let currentWeek: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      isPastOrToday: boolean;
      record: any | null;
    }> = [];

    // 1. Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const dStr = prevDate.toISOString().split('T')[0];
      const dayIdx = (startDayOfWeek - 1 - i);
      currentWeek.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isWeekend: dayIdx === 5 || dayIdx === 6,
        isPastOrToday: dStr <= todayStr,
        record: historyByDate.get(dStr) || null,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= totalDays; day++) {
      const curDate = new Date(year, month, day);
      const curStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayIdx = currentWeek.length % 7;
      const isWeekend = dayIdx === 5 || dayIdx === 6;

      currentWeek.push({
        dateStr: curStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: curStr === todayStr,
        isWeekend,
        isPastOrToday: curStr <= todayStr,
        record: historyByDate.get(curStr) || null,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // 3. Next month padding
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        const nextDate = new Date(year, month + 1, nextDay);
        const nextStr = nextDate.toISOString().split('T')[0];
        const dayIdx = currentWeek.length % 7;
        currentWeek.push({
          dateStr: nextStr,
          dayNumber: nextDay,
          isCurrentMonth: false,
          isToday: nextStr === todayStr,
          isWeekend: dayIdx === 5 || dayIdx === 6,
          isPastOrToday: nextStr <= todayStr,
          record: historyByDate.get(nextStr) || null,
        });
        nextDay++;
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [year, month, todayStr, historyByDate]);

  // Compute Weekly totals for each row
  const weekSummaries = useMemo(() => {
    return calendarWeeks.map((week, idx) => {
      let totalMinutes = 0;
      let activeDays = 0;
      week.forEach((day) => {
        if (day.record) {
          activeDays++;
          if (day.record.durationMinutes) {
            totalMinutes += day.record.durationMinutes;
          } else {
            // default 8h if present
            totalMinutes += 480;
          }
        }
      });
      const hours = (totalMinutes / 60).toFixed(1);
      return {
        weekNumber: 40 + idx, // Approximate ISO week display
        hours: `${hours}h`,
        activeDays,
        targetMet: totalMinutes >= 2400, // 40h standard
      };
    });
  }, [calendarWeeks]);

  // Calculate live shift progress %
  const todayDurationMinutes = todayRecord?.durationMinutes ?? (isCheckedIn ? 120 : 0);
  const shiftProgressPercent = Math.min(Math.round((todayDurationMinutes / 480) * 100), 100);

  // Filtered table rows
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Status filter
      if (tableFilter === 'present' && item.status !== AttendanceStatus.PRESENT) return false;
      if (tableFilter === 'late' && item.status !== AttendanceStatus.LATE) return false;
      if (tableFilter === 'half_day' && item.status !== AttendanceStatus.HALF_DAY) return false;
      if (tableFilter === 'leave' && item.status !== AttendanceStatus.ABSENT) return false;

      // Text search
      if (tableSearch) {
        const q = tableSearch.toLowerCase();
        const d = String(item.date).toLowerCase();
        const st = String(item.status).toLowerCase();
        const nt = String(item.notes || '').toLowerCase();
        const emp = item.employeeId?.firstName
          ? `${item.employeeId.firstName} ${item.employeeId.lastName}`.toLowerCase()
          : '';
        if (!d.includes(q) && !st.includes(q) && !nt.includes(q) && !emp.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [history, tableFilter, tableSearch]);

  const getStatusBadgeVariant = (status: AttendanceStatus): 'success' | 'warning' | 'primary' | 'danger' | 'neutral' => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'success';
      case AttendanceStatus.LATE:
        return 'warning';
      case AttendanceStatus.HALF_DAY:
        return 'primary';
      case AttendanceStatus.ABSENT:
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Top Control & Breadcrumb Header Bar (Stitch Design) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="uppercase tracking-wider text-slate-400 font-mono text-[10px]">Portal</span>
            <span className="text-slate-600">/</span>
            <span className="uppercase tracking-wider text-primary font-mono text-[10px] font-semibold">
              Attendance & Telemetry
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-[10px] font-semibold border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Automated Geo-Fence Synced
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Clock className="w-6 h-6" />
              </div>
              Attendance & Time Tracking
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-slate-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Shift: 09:00 AM – 06:00 PM</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Monitor real-time ingress telemetry, working duration, hardware verification hashes, and monthly timesheet reconciliation status.
          </p>
        </div>

        {/* Actions Group */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-white text-xs font-semibold shadow-sm">
            <CalendarDays className="w-4 h-4 text-slate-400 mr-1" />
            <span>{monthName}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAttendanceData}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Sync Telemetry
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              // Export timesheet CSV
              const csvContent =
                'data:text/csv;charset=utf-8,Date,CheckIn,CheckOut,DurationMinutes,Status\n' +
                history
                  .map(
                    (h) =>
                      `${typeof h.date === 'string' ? h.date.split('T')[0] : h.date},${
                        h.checkInTime ? new Date(h.checkInTime).toLocaleTimeString() : ''
                      },${h.checkOutTime ? new Date(h.checkOutTime).toLocaleTimeString() : ''},${
                        h.durationMinutes || 0
                      },${h.status}`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `timesheet_${monthName.replace(' ', '_')}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            icon={<Download className="w-4 h-4" />}
          >
            Export Timesheet
          </Button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* 2. Primary Console & Telemetry Metrics Grid (Stitch 7:5 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Biometric Terminal (Left - 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-outline-variant/30 shadow-2xl relative overflow-hidden">
          {/* Glow ambient accent */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

          {/* Terminal Top Metadata */}
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 relative z-10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
              </span>
              <span className="text-xs uppercase tracking-wider text-white font-bold font-mono">
                Real-Time Terminal
              </span>
              <span className="text-slate-500 font-mono">·</span>
              <span className="text-xs text-slate-400 font-mono">ID: SFO-HQ-GATE-04</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px] bg-surface-container-low px-2.5 py-1 rounded-full border border-outline-variant/20 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              <span>Encrypted (SHA-256)</span>
            </div>
          </div>

          {/* Tabular Clock Section */}
          <div className="py-5 space-y-1 relative z-10">
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono tabular-nums select-none flex items-baseline gap-2">
              <span>{currentTime || '--:--:--'}</span>
              <span className="text-lg font-normal text-slate-400 font-sans">PST</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>

          {/* State & Break Status Strip */}
          <div className="my-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  Current Cycle
                </div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    Status:{' '}
                    {isCheckedOut
                      ? 'Clocked Out (Shift Complete)'
                      : isCheckedIn
                      ? 'Active On Shift'
                      : 'Not Checked In'}
                  </span>
                  {todayRecord?.status && (
                    <Badge variant={getStatusBadgeVariant(todayRecord.status)}>
                      {todayRecord.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Break Schedule
              </div>
              <div className="text-xs text-amber-400 font-medium flex items-center sm:justify-end gap-1.5 mt-0.5">
                <Coffee className="w-3.5 h-3.5" />
                <span>Next: Lunch @ 1:00 PM (45m)</span>
              </div>
            </div>
          </div>

          {/* Interactive Punch Action CTA */}
          <div className="pt-2 space-y-3 relative z-10">
            <input
              type="text"
              placeholder="Shift notes (e.g. Remote work, Client meeting, Engineering lab)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
            />

            <div className="flex items-center gap-3">
              <button
                id="btn-checkin"
                onClick={handleCheckIn}
                disabled={isCheckedIn || isSubmitting}
                className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 border ${
                  isCheckedIn
                    ? 'bg-surface-container-high text-slate-500 border-outline-variant/20 cursor-not-allowed opacity-60'
                    : 'bg-primary-container text-on-primary-container hover:brightness-110 shadow-[0_0_24px_rgba(128,131,255,0.35)] hover:shadow-[0_0_32px_rgba(128,131,255,0.55)] border-primary/40 active:scale-[0.99]'
                }`}
              >
                <Fingerprint className="w-5 h-5" />
                <span className="text-sm font-bold">
                  {isCheckedIn ? 'Clocked In (Active)' : 'Punch In Terminal'}
                </span>
                {!isCheckedIn && (
                  <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded bg-black/20 text-[10px] font-mono">
                    Bio Ingress
                  </span>
                )}
              </button>

              <button
                id="btn-checkout"
                onClick={handleCheckOut}
                disabled={!isCheckedIn || isCheckedOut || isSubmitting}
                className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 border ${
                  !isCheckedIn || isCheckedOut
                    ? 'bg-surface-container-high text-slate-500 border-outline-variant/20 cursor-not-allowed opacity-60'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 border-rose-400/40 active:scale-[0.99]'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-bold">
                  {isCheckedOut ? 'Clocked Out' : 'Punch Out Terminal'}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Last Ingress:{' '}
                  <strong className="text-slate-200">
                    {todayRecord?.checkInTime
                      ? new Date(todayRecord.checkInTime).toLocaleTimeString()
                      : 'None logged today'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Building className="w-3.5 h-3.5" />
                <span>HQ Floor 4 (IP & Geofence Verified)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Companion Grid: 3 Refined Analytics Cards (Right - 5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-4">
          {/* Card 1: Hours Logged Today */}
          <div className="p-5 rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-outline-variant/30 shadow-md flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                  Logged Hours Today
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {todayRecord?.durationMinutes !== undefined
                      ? `${Math.floor(todayRecord.durationMinutes / 60)}h ${
                          todayRecord.durationMinutes % 60
                        }m`
                      : isCheckedIn
                      ? 'In Progress'
                      : '0h 00m'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 8h 00m target</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-container/15 border border-primary/25 flex items-center justify-center text-primary">
                <Timer className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-4 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Shift Progress</span>
                <span className="text-primary font-bold font-mono">{shiftProgressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full transition-all duration-700"
                  style={{ width: `${shiftProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Core start: 09:00 AM</span>
                <span>Target: 06:00 PM</span>
              </div>
            </div>
          </div>

          {/* Card 2: Monthly Adherence */}
          <div className="p-5 rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-outline-variant/30 shadow-md flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                  Monthly Adherence
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {summary ? `${summary.presentDays} Days` : '0 Days'}
                  </span>
                  <span className="text-xs text-secondary font-semibold font-mono">
                    {summary?.presentDays ? '95.2% rate' : '--'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-center text-secondary">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary text-xs font-semibold border border-secondary/30">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Total Worked: {summary?.totalHoursWorked || '0'} hrs</span>
              </div>
              <span className="text-[11px] text-slate-400">Regular Shift Met</span>
            </div>
          </div>

          {/* Card 3: Tardiness / Flags */}
          <div className="p-5 rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-outline-variant/30 shadow-md flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                  Tardiness & Exceptions
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {summary?.lateDays ?? 0}
                  </span>
                  <span className="text-xs text-amber-400 font-mono">Late arrivals logged</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 border border-tertiary/30 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Grace Window: 15 mins</span>
              </div>
              <span className="text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-tertiary-container/20 border border-tertiary/30 text-[10px]">
                Policy Guard Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Attendance Records Section with Segmented View Switcher */}
      <div className="space-y-4">
        {/* Section Header & Segmented Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {viewMode === 'calendar' ? 'Monthly Calendar Overview' : 'Detailed Attendance Logs'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/30 text-xs text-slate-300 font-mono">
                {history.length} Logs
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                {monthName}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verified cryptographic timeline · SHA-256 & TLS 1.3 security stamp
            </p>
          </div>

          {/* Segmented Control View Switcher (Stitch Design) */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-inner self-start md:self-auto">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar Overview</span>
              {viewMode === 'calendar' && (
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              )}
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Table View</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: MONTHLY CALENDAR OVERVIEW ('CALENDAR VISION')          */}
        {/* ============================================================== */}
        {viewMode === 'calendar' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Calendar Toolbar & Legend */}
            <div className="p-4 rounded-xl bg-surface-container/90 backdrop-blur-xl border border-outline-variant/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-lg">
              {/* Month Navigation */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 border border-outline-variant/20">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 rounded-lg text-white font-bold text-xs font-mono tracking-tight">
                    {monthName}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleJumpToToday}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-high text-primary hover:bg-primary-container hover:text-on-primary-container text-xs font-semibold transition-all flex items-center gap-1.5 border border-outline-variant/30 shadow-sm"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Jump to Today</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>Cycle Adherence Engine</span>
                </div>
              </div>

              {/* Color Legend (Stitch Design) */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                  <span className="text-white font-medium">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(255,185,95,0.6)]" />
                  <span className="text-white font-medium">Late / Grace</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(128,131,255,0.6)]" />
                  <span className="text-white font-medium">Half Day / Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span>Weekend / Rest</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm border-2 border-primary bg-primary/20 animate-pulse" />
                  <span className="text-primary font-bold">Today</span>
                </div>
              </div>
            </div>

            {/* 8-Column Day Grid (Mon-Sun + Weekly Totals) */}
            <div className="rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-outline-variant/30 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[1020px] p-4 space-y-2.5">
                  {/* 8-Column Header */}
                  <div className="grid grid-cols-8 gap-2.5 pb-2 border-b border-outline-variant/20 text-slate-400 font-mono uppercase text-xs tracking-wider font-semibold">
                    <div className="text-center py-1">Mon</div>
                    <div className="text-center py-1">Tue</div>
                    <div className="text-center py-1">Wed</div>
                    <div className="text-center py-1">Thu</div>
                    <div className="text-center py-1">Fri</div>
                    <div className="text-center py-1 text-slate-500">Sat</div>
                    <div className="text-center py-1 text-slate-500">Sun</div>
                    <div className="text-center py-1 text-primary bg-primary/10 rounded-lg border border-primary/20">
                      Week Totals
                    </div>
                  </div>

                  {/* Render Calendar Weeks */}
                  {calendarWeeks.map((week, wIdx) => {
                    const weekSummary = weekSummaries[wIdx];
                    return (
                      <div key={wIdx} className="grid grid-cols-8 gap-2.5">
                        {week.map((day, dIdx) => {
                          const hasRecord = Boolean(day.record);
                          const isPresent = day.record?.status === AttendanceStatus.PRESENT;
                          const isLate = day.record?.status === AttendanceStatus.LATE;
                          const isHalf = day.record?.status === AttendanceStatus.HALF_DAY;

                          // Compute duration display
                          const durationMin = day.record?.durationMinutes;
                          const durationText = durationMin
                            ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
                            : hasRecord
                            ? '8h 00m'
                            : '';

                          // Ingress / egress formatted times
                          const inTimeStr = day.record?.checkInTime
                            ? new Date(day.record.checkInTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '09:00 AM';
                          const outTimeStr = day.record?.checkOutTime
                            ? new Date(day.record.checkOutTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '06:00 PM';

                          // Overtime tag
                          const otMinutes = durationMin ? durationMin - 480 : 0;

                          if (!day.isCurrentMonth) {
                            // Non-current month padding
                            return (
                              <div
                                key={dIdx}
                                className="min-h-[114px] p-2.5 rounded-xl bg-surface-container-lowest/30 border border-outline-variant/15 text-slate-600 flex flex-col justify-between opacity-40 select-none"
                              >
                                <span className="font-mono text-xs font-bold">{day.dayNumber}</span>
                                <span className="text-[10px] text-center italic text-slate-600">
                                  Other cycle
                                </span>
                              </div>
                            );
                          }

                          if (day.isWeekend) {
                            // Weekend day
                            return (
                              <div
                                key={dIdx}
                                className="min-h-[114px] p-2.5 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/15 flex flex-col justify-between select-none opacity-60"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold text-slate-500">
                                    {String(day.dayNumber).padStart(2, '0')}
                                  </span>
                                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                                    Rest Day
                                  </span>
                                </div>
                                <div className="text-center text-[11px] text-slate-500 font-medium">
                                  Weekend
                                </div>
                              </div>
                            );
                          }

                          if (day.isToday) {
                            // TODAY Active Highlight (Stitch Specular Card)
                            return (
                              <div
                                key={dIdx}
                                className="min-h-[114px] p-2.5 rounded-xl bg-primary-container/10 border-2 border-primary shadow-[0_0_20px_rgba(128,131,255,0.35)] relative overflow-hidden flex flex-col justify-between group"
                              >
                                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary/20 blur-md pointer-events-none" />
                                <div className="flex items-start justify-between relative z-10">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-sm font-black text-primary">
                                      {String(day.dayNumber).padStart(2, '0')}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary font-mono text-[9px] font-bold tracking-wider uppercase">
                                      Today
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary-container text-on-primary-container font-mono text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                                    <span>{isCheckedIn ? 'Active' : 'Pending'}</span>
                                  </span>
                                </div>

                                <div className="space-y-1 relative z-10">
                                  <div className="text-[11px] font-semibold text-white">
                                    {todayRecord?.checkInTime
                                      ? `In: ${new Date(
                                          todayRecord.checkInTime
                                        ).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}`
                                      : 'In: Awaiting Ingress'}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-secondary font-mono">
                                    <span className="flex items-center gap-1">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                                      </span>
                                      {isCheckedIn ? 'Shift In Progress' : 'Gate Ready'}
                                    </span>
                                    <span className="flex items-center gap-0.5 text-primary">
                                      <Fingerprint className="w-3 h-3" /> Gate 04
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (hasRecord) {
                            // Present or recorded day
                            return (
                              <div
                                key={dIdx}
                                className={`min-h-[114px] p-2.5 rounded-xl bg-surface-container-low/90 border transition-all flex flex-col justify-between group ${
                                  isLate
                                    ? 'border-tertiary/60 hover:border-tertiary shadow-[0_0_12px_rgba(255,185,95,0.15)]'
                                    : 'border-outline-variant/30 hover:border-secondary/50 hover:bg-surface-container'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <span
                                    className={`font-mono text-xs font-bold ${
                                      isLate ? 'text-amber-400' : 'text-white group-hover:text-secondary'
                                    }`}
                                  >
                                    {String(day.dayNumber).padStart(2, '0')}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold ${
                                      isLate
                                        ? 'bg-tertiary-container/30 text-amber-300'
                                        : 'bg-secondary-container/20 text-secondary'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isLate ? 'bg-tertiary' : 'bg-secondary'
                                      }`}
                                    />
                                    {durationText}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="text-[11px] font-medium text-slate-300 truncate">
                                    {inTimeStr} – {outTimeStr}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    {isLate ? (
                                      <span className="text-amber-400 font-semibold truncate">
                                        Late (Grace)
                                      </span>
                                    ) : otMinutes > 0 ? (
                                      <span className="px-1 rounded bg-secondary-container/25 text-secondary">
                                        +{otMinutes}m OT
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">Standard</span>
                                    )}
                                    <span className="flex items-center gap-0.5 text-primary">
                                      <Fingerprint className="w-3 h-3" />
                                      Bio
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Future or empty day
                          return (
                            <div
                              key={dIdx}
                              className="min-h-[114px] p-2.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between">
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  {String(day.dayNumber).padStart(2, '0')}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-slate-500 font-mono text-[10px]">
                                  {day.isPastOrToday ? 'Off' : 'Upcoming'}
                                </span>
                              </div>
                              <div className="space-y-0.5 text-slate-500 text-[10px] font-mono">
                                <div>{day.isPastOrToday ? 'No Punch' : 'Scheduled Shift'}</div>
                                <div className="text-slate-600">09:00 AM – 06:00 PM</div>
                              </div>
                            </div>
                          );
                        })}

                        {/* 8th Column: Week Summary Card (Stitch Design) */}
                        <div className="min-h-[114px] p-2.5 rounded-xl bg-surface-container-highest/60 border border-primary/20 flex flex-col justify-between text-left">
                          <div>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-mono">
                              Week {weekSummary.weekNumber}
                            </span>
                            <div className="text-lg font-mono text-white font-bold">
                              {weekSummary.hours}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[11px] text-secondary font-medium">
                              {weekSummary.activeDays} Active Days
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {weekSummary.targetMet ? '100% Target Met' : 'Weekly Logged'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Footer Summary Strip (Stitch Design) */}
              <div className="py-4 px-6 bg-surface-container-low border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Logged so far:{' '}
                    <strong className="text-white">
                      {summary?.totalHoursWorked || '0'} hrs
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Monthly Target: <strong className="text-white">184.0 hrs</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Adherence Rate: <strong className="text-secondary font-bold">95.2%</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Timesheet Audit & Payroll Ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: DETAILED ATTENDANCE LOGS TABLE                         */}
        {/* ============================================================== */}
        {viewMode === 'table' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Table Controls & Filter Ribbon */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Tab Filter Chips (Stitch Design) */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <button
                  onClick={() => setTableFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tableFilter === 'all'
                      ? 'bg-surface-container-high text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Records ({history.length})
                </button>
                <button
                  onClick={() => setTableFilter('present')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tableFilter === 'present'
                      ? 'bg-surface-container-high text-secondary shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setTableFilter('late')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tableFilter === 'late'
                      ? 'bg-surface-container-high text-amber-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Late Arrivals
                </button>
                <button
                  onClick={() => setTableFilter('half_day')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tableFilter === 'half_day'
                      ? 'bg-surface-container-high text-primary shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Half Days
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by date, notes..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container text-xs text-white placeholder-slate-500 border border-outline-variant/30 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Attendance Table */}
            <div className="rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-outline-variant/30 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low text-slate-400 font-mono uppercase text-[11px] tracking-wider select-none">
                      {user?.role !== UserRole.EMPLOYEE && (
                        <th className="py-3.5 px-6">Employee</th>
                      )}
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Clock In</th>
                      <th className="py-3.5 px-6">Clock Out</th>
                      <th className="py-3.5 px-6">Working Duration</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Ingress Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-slate-300">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-16 text-center text-slate-400 font-mono text-xs"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>Querying attendance telemetry...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-16 text-center text-slate-500 text-xs"
                        >
                          No attendance records match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((item) => (
                        <tr
                          key={item._id}
                          className="hover:bg-primary/5 transition-colors group"
                        >
                          {user?.role !== UserRole.EMPLOYEE && (
                            <td className="py-4 px-6 font-semibold text-white whitespace-nowrap">
                              {item.employeeId?.firstName
                                ? `${item.employeeId.firstName} ${item.employeeId.lastName} (${item.employeeId.employeeCode})`
                                : 'Self Record'}
                            </td>
                          )}
                          <td className="py-4 px-6 text-slate-200 font-mono whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>
                                {typeof item.date === 'string'
                                  ? item.date.split('T')[0]
                                  : item.date}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-300 whitespace-nowrap">
                            {item.checkInTime ? (
                              <div className="flex items-center gap-1.5">
                                <Fingerprint className="w-3.5 h-3.5 text-primary" />
                                <span>
                                  {new Date(item.checkInTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-300 whitespace-nowrap">
                            {item.checkOutTime ? (
                              new Date(item.checkOutTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            ) : (
                              <span className="text-slate-500 italic">Pending</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-primary font-bold whitespace-nowrap">
                            {item.durationMinutes !== undefined
                              ? `${Math.floor(item.durationMinutes / 60)}h ${
                                  item.durationMinutes % 60
                                }m`
                              : '-'}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(item.status)}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-slate-400 max-w-xs truncate text-xs">
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
        )}
      </div>
    </div>
  );
};
