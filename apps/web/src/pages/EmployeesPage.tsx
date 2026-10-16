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
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  Mail,
  User,
  Briefcase,
  Building2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Input,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';

export const EmployeesPage: React.FC = () => {
  const { can, user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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
      {/* 1. Header with Breadcrumbs & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </span>
              <span>{user?.role === 'MANAGER' ? 'Team Directory' : 'Employees Directory'}</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-highest text-indigo-300 font-mono font-semibold border border-white/10">
              {meta.total} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {user?.role === 'MANAGER'
              ? 'Directory of direct reporting lines and assigned personnel.'
              : 'Global employee directory, organizational units, and status administration.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Table / Grid view switcher */}
          <div className="flex items-center bg-surface-container rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'table'
                  ? 'bg-surface-highest text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'grid'
                  ? 'bg-surface-highest text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {can(Permission.EMPLOYEES_CREATE) && (
            <Button
              onClick={() => setIsModalOpen(true)}
              id="btn-add-employee"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* 2. Filter Ribbon (Stitch Directory Design) */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center gap-3 border border-white/10 shadow-glass">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            id="input-employee-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMeta((m: any) => ({ ...m, page: 1 }));
            }}
            placeholder="Search by name, code, or email..."
            className="glass-input block w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 font-medium"
          />
        </div>

        {/* Department Filter */}
        <select
          value={departmentId}
          id="select-department-filter"
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setMeta((m: any) => ({ ...m, page: 1 }));
          }}
          className="glass-input px-3.5 py-2 rounded-xl text-xs font-medium text-slate-200 cursor-pointer focus:outline-none"
        >
          <option value="" className="bg-[#0f2035] text-slate-300">
            All Departments
          </option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id} className="bg-[#0f2035] text-slate-300">
              {dept.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          id="select-status-filter"
          onChange={(e) => {
            setStatus(e.target.value);
            setMeta((m: any) => ({ ...m, page: 1 }));
          }}
          className="glass-input px-3.5 py-2 rounded-xl text-xs font-medium text-slate-200 cursor-pointer focus:outline-none"
        >
          <option value="" className="bg-[#0f2035] text-slate-300">
            All Statuses
          </option>
          <option value="ACTIVE" className="bg-[#0f2035] text-emerald-400">
            Active
          </option>
          <option value="PROBATION" className="bg-[#0f2035] text-amber-400">
            Probation
          </option>
          <option value="NOTICE" className="bg-[#0f2035] text-sky-400">
            Notice
          </option>
          <option value="TERMINATED" className="bg-[#0f2035] text-rose-400">
            Terminated
          </option>
        </select>

        {/* Sort by Field */}
        <select
          value={sortBy}
          id="select-sort-by"
          onChange={(e) => setSortBy(e.target.value)}
          className="glass-input px-3.5 py-2 rounded-xl text-xs font-medium text-slate-200 cursor-pointer focus:outline-none"
        >
          <option value="createdAt" className="bg-[#0f2035]">
            Date Created
          </option>
          <option value="firstName" className="bg-[#0f2035]">
            First Name
          </option>
          <option value="lastName" className="bg-[#0f2035]">
            Last Name
          </option>
          <option value="employeeCode" className="bg-[#0f2035]">
            Employee Code
          </option>
          <option value="position" className="bg-[#0f2035]">
            Position
          </option>
        </select>

        {/* Sort Direction Toggle */}
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-high border border-white/10 text-slate-300 hover:text-white transition shadow-sm"
          title={`Order: ${sortOrder.toUpperCase()}`}
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Directory Content: Table or Grid View */}
      {viewMode === 'table' ? (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Code</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono">Loading employee records...</span>
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No employees found</p>
                  <p className="text-xs text-slate-500">
                    Try adjusting your search criteria or clear active filters.
                  </p>
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell className="font-mono text-indigo-400 font-bold tracking-tight">
                    {emp.employeeCode}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {emp.firstName?.[0]}
                        {emp.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white leading-tight">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-lg bg-surface-high border border-white/10 text-xs font-medium text-slate-300">
                      {emp.departmentId?.name || 'Unassigned'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-300 font-medium">{emp.position}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        emp.status === 'ACTIVE'
                          ? 'success'
                          : emp.status === 'TERMINATED'
                          ? 'danger'
                          : emp.status === 'PROBATION'
                          ? 'warning'
                          : 'primary'
                      }
                      dot
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/employees/${emp._id}`}
                      id={`btn-view-${emp.employeeCode?.toLowerCase()}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-high hover:bg-surface-highest text-indigo-300 hover:text-white border border-white/10 text-xs font-semibold transition shadow-sm"
                    >
                      <span>View Profile</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 glass-card rounded-2xl animate-pulse" />
            ))
          ) : employees.length === 0 ? (
            <div className="col-span-full text-center py-12 glass-panel rounded-2xl">
              <p className="text-sm text-slate-400">No employees match filters.</p>
            </div>
          ) : (
            employees.map((emp) => (
              <Card key={emp._id} className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-base">
                    {emp.firstName?.[0]}
                    {emp.lastName?.[0]}
                  </div>
                  <Badge
                    variant={
                      emp.status === 'ACTIVE'
                        ? 'success'
                        : emp.status === 'TERMINATED'
                        ? 'danger'
                        : 'warning'
                    }
                    dot
                  >
                    {emp.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium">{emp.position}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{emp.email}</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">{emp.employeeCode}</span>
                  <Link
                    to={`/employees/${emp._id}`}
                    className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1"
                  >
                    <span>Profile</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 4. Pagination Controls (Stitch layout) */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant border border-white/10 shadow-glass">
        <span>
          Showing {(meta.page - 1) * meta.limit + (employees.length ? 1 : 0)} to{' '}
          {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} records
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={meta.page <= 1}
            onClick={() => setMeta((m: any) => ({ ...m, page: m.page - 1 }))}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Prev
          </Button>

          <span className="px-3 py-1.5 rounded-xl bg-surface-high border border-white/10 font-mono font-semibold text-white">
            Page {meta.page} of {meta.totalPages || 1}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setMeta((m: any) => ({ ...m, page: m.page + 1 }))}
            icon={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        </div>
      </div>

      {/* 5. Add Employee Multi-Step / Glass Modal (Stitch Screen 20dbdbd9...) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Employee Record"
        description="Onboard a new employee into the enterprise directory and generate their access credentials."
        maxWidth="xl"
      >
        {modalError && (
          <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="First Name *"
              id="input-create-first-name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Elena"
              icon={<User className="w-4 h-4" />}
            />

            <Input
              label="Last Name *"
              id="input-create-last-name"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="e.g. Rostova"
              icon={<User className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Work Email Address *"
            id="input-create-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="elena.rostova@hrx.local"
            icon={<Mail className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Position / Role *"
              id="input-create-position"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g. Head of People Ops"
              icon={<Briefcase className="w-4 h-4" />}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Department
              </label>
              <select
                value={formData.departmentId}
                id="select-create-department"
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="glass-input block w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-100 cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-[#0f2035]">
                  Select Department
                </option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id} className="bg-[#0f2035]">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Phone Number"
            id="input-create-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1-555-0192"
            icon={<Phone className="w-4 h-4" />}
          />

          {/* User Account Provisioning Toggle */}
          <div className="p-3.5 rounded-xl bg-surface-high/60 border border-white/10 flex items-start gap-3 mt-2">
            <input
              type="checkbox"
              id="check-create-account"
              checked={formData.createLoginAccount}
              onChange={(e) =>
                setFormData({ ...formData, createLoginAccount: e.target.checked })
              }
              className="w-4 h-4 mt-0.5 rounded text-indigo-600 bg-slate-900 border-white/20 focus:ring-indigo-500"
            />
            <label htmlFor="check-create-account" className="text-xs text-slate-300 cursor-pointer">
              <span className="font-semibold text-white block">Provision User Login Account</span>
              Automatically generates system credentials with default password (Password123!).
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              id="btn-submit-create-employee"
              variant="primary"
              isLoading={modalLoading}
            >
              Confirm & Onboard
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
