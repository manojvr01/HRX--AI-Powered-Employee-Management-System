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
  Building,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { IOrgSettings, IHoliday } from '@hrx/shared';

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
        setFeedback({ type: 'success', message: 'Organization settings updated successfully!' });
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
      setFeedback({ type: 'success', message: 'Holiday added successfully!' });
      await loadData();
    } catch (err: any) {
      setHolidayModalError(err?.message || 'Failed to create holiday');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await apiRequest(`/settings/holidays/${id}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: 'Holiday removed successfully' });
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
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">System & Org Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure organization working schedules, holiday calendars, and global attendance rules
        </p>
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
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('org')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'org'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Organization Rules
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'holidays'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Holiday Calendar ({holidays.length})
        </button>
      </div>

      {/* Tab 1: Org Settings */}
      {activeTab === 'org' && settings && (
        <form onSubmit={handleSaveSettings} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                <option value="America/New_York">America/New_York (EST -05:00)</option>
                <option value="Europe/London">Europe/London (GMT +00:00)</option>
                <option value="UTC">UTC (Universal Time)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Late Grace Threshold (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={settings.lateThresholdMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, lateThresholdMinutes: Number(e.target.value) })
                }
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Code</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Workday Start Hour (0-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.workDayStartHour}
                onChange={(e) =>
                  setSettings({ ...settings, workDayStartHour: Number(e.target.value) })
                }
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Workday End Hour (0-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.workDayEndHour}
                onChange={(e) =>
                  setSettings({ ...settings, workDayEndHour: Number(e.target.value) })
                }
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Working Days of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((d) => {
                const active = settings.workWeekDays?.includes(d.value);
                return (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleWorkDay(d.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      active
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              id="btn-save-settings"
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Holidays */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Official organization holidays are automatically excluded from leave working-day deductions.
            </p>
            <button
              id="btn-add-holiday"
              onClick={() => setIsAddHolidayModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Holiday
            </button>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-3 px-4">Holiday Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                        No holidays registered for this calendar year.
                      </td>
                    </tr>
                  ) : (
                    holidays.map((h) => (
                      <tr key={h._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold text-white">{h.name}</td>
                        <td className="py-3 px-4 text-indigo-400 font-mono">{h.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              h.isOptional
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {h.isOptional ? 'Optional' : 'Mandatory'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{h.description || '-'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteHoliday(h._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-800 w-full max-w-md p-6 bg-slate-900 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add New Holiday</h3>

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
                  placeholder="e.g. Independence Day"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. National holiday celebration"
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="opt-holiday"
                  checked={holidayOptional}
                  onChange={(e) => setHolidayOptional(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="opt-holiday" className="text-xs text-slate-300">
                  Optional / Restricted holiday
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-add-holiday"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  Add Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
