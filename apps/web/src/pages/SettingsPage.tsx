import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Globe,
  Building2,
  CalendarDays,
  ShieldCheck,
  Coins,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { IOrgSettings, IHoliday } from '@hrx/shared';
import { Card, Badge, Button, Input, StatCard } from '../components/ui';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'org' | 'holidays'>('org');
  const [settings, setSettings] = useState<IOrgSettings | null>(null);
  const [holidays, setHolidays] = useState<IHoliday[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Holiday Modal
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState<boolean>(false);
  const [holidayName, setHolidayName] = useState<string>('');
  const [holidayDate, setHolidayDate] = useState<string>('');
  const [holidayDescription, setHolidayDescription] = useState<string>('');
  const [holidayOptional, setHolidayOptional] = useState<boolean>(false);
  const [holidayModalError, setHolidayModalError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const [settingsRes, holidaysRes] = await Promise.all([
        apiRequest<IOrgSettings>('/settings/org'),
        apiRequest<IHoliday[]>('/settings/holidays'),
      ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
      if (holidaysRes.data) {
        setHolidays(holidaysRes.data);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load settings data' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await apiRequest<IOrgSettings>('/settings/org', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      if (res.data) {
        setSettings(res.data);
        setFeedback({ type: 'success', message: 'Enterprise organization policies updated successfully!' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim() || !holidayDate) {
      setHolidayModalError('Please provide both a name and date');
      return;
    }

    setHolidayModalError(null);
    try {
      await apiRequest('/settings/holidays', {
        method: 'POST',
        body: JSON.stringify({
          name: holidayName,
          date: holidayDate,
          description: holidayDescription || undefined,
          isOptional: holidayOptional,
        }),
      });

      setIsAddHolidayModalOpen(false);
      setHolidayName('');
      setHolidayDate('');
      setHolidayDescription('');
      setHolidayOptional(false);
      setFeedback({ type: 'success', message: 'Holiday added to official calendar successfully!' });
      await loadData();
    } catch (err: any) {
      setHolidayModalError(err?.message || 'Failed to create holiday');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await apiRequest(`/settings/holidays/${id}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: 'Holiday removed from calendar' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete holiday' });
    }
  };

  const toggleWorkDay = (day: number) => {
    if (!settings) return;
    const current = settings.workWeekDays || [];
    const exists = current.includes(day);
    const updated = exists ? current.filter((d: number) => d !== day) : [...current, day].sort();
    setSettings({ ...settings, workWeekDays: updated });
  };

  const daysOfWeek = [
    { label: 'Sunday', short: 'Sun', value: 0 },
    { label: 'Monday', short: 'Mon', value: 1 },
    { label: 'Tuesday', short: 'Tue', value: 2 },
    { label: 'Wednesday', short: 'Wed', value: 3 },
    { label: 'Thursday', short: 'Thu', value: 4 },
    { label: 'Friday', short: 'Fri', value: 5 },
    { label: 'Saturday', short: 'Sat', value: 6 },
  ];

  const mandatoryCount = holidays.filter((h) => !h.isOptional).length;
  const optionalCount = holidays.filter((h) => h.isOptional).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-primary-container/20 text-primary border border-primary/30">
              Enterprise Governance
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Policy Engine Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sliders className="w-5 h-5" />
            </div>
            System & Enterprise Settings
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure working schedules, automated late arrival thresholds, payroll currency, and statutory holidays.
          </p>
        </div>

        {activeTab === 'holidays' && (
          <Button
            id="btn-add-holiday"
            variant="primary"
            size="sm"
            onClick={() => setIsAddHolidayModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Holiday
          </Button>
        )}
      </div>

      {/* Global Alerts / Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border animate-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
        <button
          onClick={() => setActiveTab('org')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'org'
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-container-high/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Organization & Working Rules
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'holidays'
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-container-high/40'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Holiday Calendar
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'holidays'
                ? 'bg-on-primary/20 text-on-primary'
                : 'bg-surface-container-high text-slate-400'
            }`}
          >
            {holidays.length}
          </span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading enterprise configuration...</p>
        </div>
      ) : activeTab === 'org' && settings ? (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Section 1: Enterprise Profile */}
          <Card variant="glass" className="p-6 space-y-5 border-outline-variant/30">
            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-white tracking-wide">Enterprise Identity & Locale</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Legal Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  required
                  placeholder="e.g. Acme Global Corporation"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-secondary" /> Operating Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors font-mono"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                  <option value="America/New_York">America/New_York (EST -05:00)</option>
                  <option value="Europe/London">Europe/London (GMT +00:00)</option>
                  <option value="UTC">UTC (Universal Time)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Default Currency Code
                </label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g. INR, USD, EUR"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors font-mono"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Working Hours & Attendance Rules */}
          <Card variant="glass" className="p-6 space-y-5 border-outline-variant/30">
            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <Clock className="w-4 h-4 text-secondary" />
              <h2 className="text-sm font-bold text-white tracking-wide">Working Hours & Attendance Tolerance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workday Shift Start (Hour 0-23)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={settings.workDayStartHour}
                    onChange={(e) =>
                      setSettings({ ...settings, workDayStartHour: Number(e.target.value) })
                    }
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs text-white focus:outline-none focus:border-primary/50 font-mono transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                    :00 hrs
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Default start time e.g. 9 for 09:00 AM</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workday Shift End (Hour 0-23)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={settings.workDayEndHour}
                    onChange={(e) =>
                      setSettings({ ...settings, workDayEndHour: Number(e.target.value) })
                    }
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs text-white focus:outline-none focus:border-primary/50 font-mono transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                    :00 hrs
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Default checkout time e.g. 18 for 06:00 PM</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Late Grace Threshold (Minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={settings.lateThresholdMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, lateThresholdMinutes: Number(e.target.value) })
                    }
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs text-white focus:outline-none focus:border-primary/50 font-mono transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-mono">
                    mins
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Punches after this are flagged as Late Arrival</p>
              </div>
            </div>
          </Card>

          {/* Section 3: Official Work Week */}
          <Card variant="glass" className="p-6 space-y-5 border-outline-variant/30">
            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">Official Working Days of the Week</h2>
            </div>

            <p className="text-xs text-slate-400">
              Selected days are treated as standard working business days. Unselected days (weekends) are exempt from leave deductions.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {daysOfWeek.map((d) => {
                const active = settings.workWeekDays?.includes(d.value);
                return (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleWorkDay(d.value)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5 ${
                      active
                        ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-surface-container-lowest/60 border-outline-variant/20 text-slate-400 hover:text-white hover:bg-surface-container-high/40'
                    }`}
                  >
                    <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
                      {d.short}
                    </span>
                    <span className="text-sm font-semibold">{d.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        active
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-high text-slate-500'
                      }`}
                    >
                      {active ? 'Working' : 'Off'}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Form Action */}
          <div className="flex justify-end pt-2">
            <Button
              id="btn-save-settings"
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              {isSaving ? 'Applying Settings...' : 'Save Enterprise Settings'}
            </Button>
          </div>
        </form>
      ) : activeTab === 'holidays' ? (
        <div className="space-y-6">
          {/* Stat highlights for holidays */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Official Calendar Days"
              value={holidays.length}
              subtitle="Scheduled holiday breaks"
              icon={<Calendar className="w-5 h-5 text-primary" />}
              iconColor="primary"
            />
            <StatCard
              title="Mandatory Closures"
              value={mandatoryCount}
              subtitle="Full organization shutdown"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              iconColor="secondary"
            />
            <StatCard
              title="Optional / Restricted"
              value={optionalCount}
              subtitle="Floating individual choice"
              icon={<Sparkles className="w-5 h-5 text-amber-400" />}
              iconColor="tertiary"
            />
          </div>

          {/* Holiday List Table */}
          <Card variant="glass" className="overflow-hidden border-outline-variant/30 p-0">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-surface-container-lowest/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-white tracking-wide">Statutory Holiday Schedule</h2>
              </div>
              <p className="text-xs text-slate-400">
                Official holidays are automatically deducted from billable leave calculations.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/70 text-slate-400 font-mono uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-6">Holiday Title</th>
                    <th className="py-3.5 px-6">Calendar Date</th>
                    <th className="py-3.5 px-6">Classification</th>
                    <th className="py-3.5 px-6">Description / Notes</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-slate-300">
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-500 text-xs">
                        No statutory holidays scheduled for this calendar cycle. Click "Add Holiday" to register one.
                      </td>
                    </tr>
                  ) : (
                    holidays.map((h) => (
                      <tr key={h._id} className="hover:bg-primary/5 transition-colors group">
                        <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                          {h.name}
                        </td>
                        <td className="py-4 px-6 font-mono text-primary font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{h.date}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <Badge variant={h.isOptional ? 'warning' : 'success'}>
                            {h.isOptional ? 'Optional / Floating' : 'Mandatory Closure'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-slate-400 max-w-sm truncate text-xs">
                          {h.description || '-'}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteHoliday(h._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete holiday"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Add Holiday Modal */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-white">Add Statutory Holiday</h3>
              </div>
              <button
                onClick={() => setIsAddHolidayModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {holidayModalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {holidayModalError}
              </div>
            )}

            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Independence Day, Annual Shutdown"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-white focus:outline-none focus:border-primary/50 font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Official national observance"
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="opt-holiday"
                  checked={holidayOptional}
                  onChange={(e) => setHolidayOptional(e.target.checked)}
                  className="rounded border-outline-variant/40 bg-surface-container-low text-primary focus:ring-0 w-4 h-4"
                />
                <label htmlFor="opt-holiday" className="text-xs text-slate-300 cursor-pointer">
                  Optional / Restricted (Floating) holiday
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddHolidayModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  id="btn-confirm-add-holiday"
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save Holiday
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
