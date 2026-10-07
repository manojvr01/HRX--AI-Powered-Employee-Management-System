import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Permission } from '@hrx/shared';
import {
  Building2,
  Plus,
  Users,
  Shield,
  X,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const { can } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/departments');
      setDepartments(res.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      await apiRequest('/departments', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
      fetchDepartments();
    } catch (err: any) {
      setModalError(err.error?.message || 'Failed to create department');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Departments
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Operational business units, team structures, and employee counts.
          </p>
        </div>

        {can(Permission.DEPARTMENTS_MANAGE) && (
          <button
            onClick={() => setIsModalOpen(true)}
            id="btn-add-department"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        )}
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
          No active departments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="glass-panel p-6 rounded-2xl space-y-4 hover:border-indigo-500/30 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-300">
                    {dept.code}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mt-3">{dept.name}</h2>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {dept.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{dept.employeeCount || 0}</span>
                  <span>staff</span>
                </div>

                <div className="text-slate-400 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Head</span>
                  <span className="text-slate-200 font-medium">
                    {dept.headId
                      ? `${dept.headId.firstName} ${dept.headId.lastName}`
                      : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 space-y-5 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Create Department</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  id="input-department-name"
                  placeholder="e.g. Finance & Accounting"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  id="input-department-code"
                  placeholder="e.g. FIN"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  id="textarea-department-description"
                  placeholder="Brief description of department responsibility..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-create-department"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {modalLoading ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
