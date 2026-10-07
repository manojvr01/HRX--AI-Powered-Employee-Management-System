import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Permission } from '@hrx/shared';
import {
  Users,
  Search,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { can, user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    departmentId: '',
    phone: '',
    createLoginAccount: true,
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/employees', {
        params: {
          page: meta.page,
          limit: meta.limit,
          search: search || undefined,
          departmentId: departmentId || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
        },
      });
      setEmployees(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, search, departmentId, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await apiRequest('/departments');
        setDepartments(res.data || []);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    }
    loadDepts();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          position: formData.position,
          departmentId: formData.departmentId || undefined,
          phone: formData.phone || undefined,
          createLoginAccount: formData.createLoginAccount,
        }),
      });

      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        departmentId: '',
        phone: '',
        createLoginAccount: true,
      });
      fetchEmployees();
    } catch (err: any) {
      setModalError(err.error?.message || 'Failed to create employee');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            {user?.role === 'MANAGER' ? 'Team Directory' : 'Employee Directory'}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {user?.role === 'MANAGER'
              ? 'Scoped view of direct reports and reporting team members.'
              : 'Manage employee profiles, roles, and status.'}
          </p>
        </div>

        {can(Permission.EMPLOYEES_CREATE) && (
          <button
            onClick={() => setIsModalOpen(true)}
            id="btn-add-employee"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            id="input-employee-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMeta((m: any) => ({ ...m, page: 1 }));
            }}
            placeholder="Search by name, code, email..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={departmentId}
          id="select-department-filter"
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setMeta((m: any) => ({ ...m, page: 1 }));
          }}
          className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          id="select-status-filter"
          onChange={(e) => {
            setStatus(e.target.value);
            setMeta((m: any) => ({ ...m, page: 1 }));
          }}
          className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PROBATION">Probation</option>
          <option value="NOTICE">Notice</option>
          <option value="TERMINATED">Terminated</option>
        </select>

        <select
          value={sortBy}
          id="select-sort-by"
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="createdAt">Date Created</option>
          <option value="firstName">First Name</option>
          <option value="lastName">Last Name</option>
          <option value="employeeCode">Employee Code</option>
          <option value="position">Position</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white transition"
          title="Toggle sort direction"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Employees Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Position</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading employee records...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No employees matching filter criteria found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono text-indigo-400 font-bold">
                      {emp.employeeCode}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center font-bold">
                          {emp.firstName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {emp.departmentId?.name || 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{emp.position}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : emp.status === 'TERMINATED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/employees/${emp._id}`}
                        id={`btn-view-${emp.employeeCode.toLowerCase()}`}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold transition"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(meta.page - 1) * meta.limit + (employees.length ? 1 : 0)} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} records
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setMeta((m: any) => ({ ...m, page: m.page - 1 }))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-200">
              Page {meta.page} of {meta.totalPages || 1}
            </span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setMeta((m: any) => ({ ...m, page: m.page + 1 }))}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 space-y-5 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Create New Employee</h2>
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

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    id="input-create-first-name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    id="input-create-last-name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  id="input-create-email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Position *</label>
                  <input
                    type="text"
                    required
                    id="input-create-position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    id="select-create-department"
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  id="input-create-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="check-create-account"
                  checked={formData.createLoginAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, createLoginAccount: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="check-create-account" className="text-slate-300">
                  Generate user login account with default password (Password123!)
                </label>
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
                  id="btn-submit-create-employee"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {modalLoading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
