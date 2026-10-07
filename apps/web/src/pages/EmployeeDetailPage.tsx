import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Permission, UserRole } from '@hrx/shared';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Briefcase,
  UserCheck,
  Edit,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, can } = useAuth();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'contact' | 'compensation'>('overview');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    phone: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    position: '',
    status: '',
  });

  const fetchEmployee = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiRequest(`/employees/${id}`);
      setEmployee(res.data);
      setFormData({
        phone: res.data.phone || '',
        emergencyName: res.data.emergencyContact?.name || '',
        emergencyPhone: res.data.emergencyContact?.phone || '',
        emergencyRelationship: res.data.emergencyContact?.relationship || '',
        position: res.data.position || '',
        status: res.data.status || '',
      });
    } catch (err: any) {
      setError(err.error?.message || 'Failed to load employee profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setEditLoading(true);
    setEditError(null);

    const isSelf = user?.employee?.id === id;
    const isManagement = user?.role === UserRole.ADMIN || user?.role === UserRole.HR;

    const payload: any = {
      phone: formData.phone,
      emergencyContact: {
        name: formData.emergencyName,
        phone: formData.emergencyPhone,
        relationship: formData.emergencyRelationship,
      },
    };

    if (isManagement) {
      if (formData.position) payload.position = formData.position;
      if (formData.status) payload.status = formData.status;
    }

    try {
      await apiRequest(`/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setIsEditModalOpen(false);
      fetchEmployee();
    } catch (err: any) {
      setEditError(err.error?.message || 'Failed to update employee');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 glass-panel rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
        <p className="font-semibold">{error || 'Employee not found'}</p>
        <button
          onClick={() => navigate('/employees')}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs"
        >
          &larr; Back to Directory
        </button>
      </div>
    );
  }

  const isSelf = user?.employee?.id === employee._id;
  const canEdit = isSelf || can(Permission.EMPLOYEES_EDIT);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header Profile Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-indigo-500">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-extrabold text-2xl border border-indigo-500/30 overflow-hidden">
            {employee.avatarUrl ? (
              <img
                src={employee.avatarUrl}
                alt={employee.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              `${employee.firstName[0]}${employee.lastName[0]}`
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {employee.firstName} {employee.lastName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${employee.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
              >
                {employee.status}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">{employee.position}</p>
            <p className="text-xs font-mono text-indigo-400 mt-0.5">{employee.employeeCode}</p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            id="btn-edit-employee"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition border border-slate-700"
          >
            <Edit className="w-4 h-4 text-indigo-400" />
            {isSelf ? 'Edit My Contact Info' : 'Edit Employee'}
          </button>
        )}
      </div>

      {/* Detail Tabs Header */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition relative ${activeTab === 'overview'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Overview & Organization
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`pb-3 transition relative ${activeTab === 'contact'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Contact & Emergency
        </button>

        {(isSelf || can(Permission.PAYROLL_READ_ALL)) && (
          <button
            onClick={() => setActiveTab('compensation')}
            className={`pb-3 transition relative ${activeTab === 'compensation'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Compensation & Salary
          </button>
        )}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Organizational Hierarchy
            </h2>
            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-200 font-semibold">
                  {employee.departmentId?.name || 'Unassigned'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Department Code</span>
                <span className="text-slate-200 font-mono">
                  {employee.departmentId?.code || 'N/A'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Reporting Manager</span>
                <span className="text-slate-200 font-semibold">
                  {employee.managerId
                    ? `${employee.managerId.firstName} ${employee.managerId.lastName}`
                    : 'None / Executive'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Date of Joining</span>
                <span className="text-slate-200 font-semibold">{employee.joiningDate}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Account Status
            </h2>
            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Employment Status</span>
                <span className="text-emerald-400 font-bold">{employee.status}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Portal User Account</span>
                <span className="text-slate-200">
                  {employee.userId ? 'Activated (Credentials Issued)' : 'No Account Linked'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Record Created</span>
                <span className="text-slate-200">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Contact & Emergency */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400" />
              Contact Details
            </h2>
            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Work Email</span>
                <span className="text-slate-200 font-semibold">{employee.email}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-slate-200 font-semibold">
                  {employee.phone || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              Emergency Contact
            </h2>
            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Contact Name</span>
                <span className="text-slate-200 font-semibold">
                  {employee.emergencyContact?.name || 'Not provided'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Relationship</span>
                <span className="text-slate-200 font-semibold">
                  {employee.emergencyContact?.relationship || 'Not provided'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Emergency Phone</span>
                <span className="text-slate-200 font-semibold">
                  {employee.emergencyContact?.phone || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Compensation */}
      {activeTab === 'compensation' && (isSelf || can(Permission.PAYROLL_READ_ALL)) && (
        <div className="glass-panel p-6 rounded-2xl space-y-4 max-w-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Monthly Salary Breakdown
          </h2>

          <div className="divide-y divide-slate-800/80 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Basic Salary</span>
              <span className="text-slate-200 font-semibold font-mono">
                ${employee.salary?.basic || 0}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">House Rent Allowance (HRA)</span>
              <span className="text-slate-200 font-semibold font-mono">
                ${employee.salary?.hra || 0}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Special Allowances</span>
              <span className="text-slate-200 font-semibold font-mono">
                ${employee.salary?.allowances || 0}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Deductions</span>
              <span className="text-rose-400 font-semibold font-mono">
                -${employee.salary?.deductions || 0}
              </span>
            </div>
            <div className="py-3 flex justify-between border-t border-slate-700 text-sm font-bold">
              <span className="text-white">Estimated Net Monthly</span>
              <span className="text-emerald-400 font-mono">
                $
                {(employee.salary?.basic || 0) +
                  (employee.salary?.hra || 0) +
                  (employee.salary?.allowances || 0) -
                  (employee.salary?.deductions || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 space-y-5 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {isSelf ? 'Update Contact Information' : 'Update Employee Record'}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  id="input-edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Emergency Contact
                </p>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Contact Name</label>
                  <input
                    type="text"
                    id="input-edit-emergency-name"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Relationship</label>
                    <input
                      type="text"
                      id="input-edit-emergency-relationship"
                      placeholder="e.g. Spouse, Parent"
                      value={formData.emergencyRelationship}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyRelationship: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      id="input-edit-emergency-phone"
                      value={formData.emergencyPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyPhone: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {!isSelf && (user?.role === UserRole.ADMIN || user?.role === UserRole.HR) && (
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Management Controls
                  </p>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Position</label>
                    <input
                      type="text"
                      id="input-edit-position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Status</label>
                    <select
                      value={formData.status}
                      id="select-edit-status"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PROBATION">PROBATION</option>
                      <option value="NOTICE">NOTICE</option>
                      <option value="TERMINATED">TERMINATED</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-edit-employee"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
