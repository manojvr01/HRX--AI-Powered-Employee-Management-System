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
} from '../components/ui';

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
      {/* 1. Breadcrumb Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group"
      >
        <span className="p-1 rounded-lg bg-surface-container border border-white/10 group-hover:bg-surface-high">
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
        <span>Back to Employees Directory</span>
      </button>

      {/* 2. Hero Profile Glass Card (Stitch Elena Rostova Profile Design) */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-panel border border-white/10 shadow-glass">
        {/* Subtle background flare */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-600/15 via-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl border border-white/20 shadow-glow-primary overflow-hidden">
                {employee.avatarUrl ? (
                  <img
                    src={employee.avatarUrl}
                    alt={employee.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`
                )}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-4 ring-surface-lowest flex items-center justify-center ${
                  employee.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                title={employee.status}
              />
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {employee.firstName} {employee.lastName}
                </h1>
                <Badge
                  variant={
                    employee.status === 'ACTIVE'
                      ? 'success'
                      : employee.status === 'TERMINATED'
                      ? 'danger'
                      : 'warning'
                  }
                  dot
                >
                  {employee.status}
                </Badge>
              </div>

              <p className="text-sm sm:text-base font-medium text-indigo-300">
                {employee.position}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant pt-1 font-mono">
                <span className="px-2 py-0.5 rounded-md bg-surface-high border border-white/10 text-indigo-300 font-bold">
                  {employee.employeeCode}
                </span>
                <span>•</span>
                <span>{employee.departmentId?.name || 'Unassigned Division'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {employee.email}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          {canEdit && (
            <Button
              onClick={() => setIsEditModalOpen(true)}
              id="btn-edit-employee"
              variant="secondary"
              icon={<Edit className="w-4 h-4 text-indigo-400" />}
            >
              {isSelf ? 'Edit My Contact Info' : 'Edit Employee Record'}
            </Button>
          )}
        </div>
      </div>

      {/* 3. Detail Tabs Header */}
      <div className="flex border-b border-white/10 gap-6 text-xs sm:text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition relative shrink-0 ${
            activeTab === 'overview'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Organization
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`pb-3 transition relative shrink-0 ${
            activeTab === 'contact'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Contact & Emergency
        </button>

        {(isSelf || can(Permission.PAYROLL_READ_ALL)) && (
          <button
            onClick={() => setActiveTab('compensation')}
            className={`pb-3 transition relative shrink-0 ${
              activeTab === 'compensation'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compensation & Salary
          </button>
        )}
      </div>

      {/* 4. Tab 1: Overview & Organization */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <div>
                <CardTitle>Organizational Hierarchy</CardTitle>
                <CardDescription>Department assignment and reporting structure</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-white/5 text-xs sm:text-sm pt-0">
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Department</span>
                <span className="text-white font-semibold">
                  {employee.departmentId?.name || 'Unassigned'}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Department Code</span>
                <span className="text-white font-mono">
                  {employee.departmentId?.code || 'N/A'}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Reporting Manager</span>
                <span className="text-white font-semibold">
                  {employee.managerId
                    ? `${employee.managerId.firstName} ${employee.managerId.lastName}`
                    : 'None / Executive Direct'}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Date of Joining</span>
                <span className="text-white font-mono">{employee.joiningDate}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <CardTitle>Employment & Security</CardTitle>
                <CardDescription>Verification level and access credentials</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-white/5 text-xs sm:text-sm pt-0">
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Employment Status</span>
                <Badge variant="success" dot>
                  {employee.status}
                </Badge>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Portal User Account</span>
                <span className="text-slate-200">
                  {employee.userId ? 'Activated (SSO & Credentials)' : 'No Account Linked'}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Record Created</span>
                <span className="text-slate-200 font-mono">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Tab 2: Contact & Emergency */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <div>
                <CardTitle>Contact Details</CardTitle>
                <CardDescription>Primary work channels</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-white/5 text-xs sm:text-sm pt-0">
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Work Email</span>
                <span className="text-white font-mono font-medium">{employee.email}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-white font-mono font-medium">
                  {employee.phone || 'Not provided'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <div>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>Designated point of contact</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-white/5 text-xs sm:text-sm pt-0">
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Contact Name</span>
                <span className="text-white font-medium">
                  {employee.emergencyContact?.name || 'Not provided'}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Relationship</span>
                <span className="text-white font-medium">
                  {employee.emergencyContact?.relationship || 'Not provided'}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-slate-400">Emergency Phone</span>
                <span className="text-white font-mono font-medium">
                  {employee.emergencyContact?.phone || 'Not provided'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. Tab 3: Compensation & Salary */}
      {activeTab === 'compensation' && (isSelf || can(Permission.PAYROLL_READ_ALL)) && (
        <Card className="max-w-xl">
          <CardHeader className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <CardTitle>Monthly Compensation Breakdown</CardTitle>
              <CardDescription>Base salary, statutory allowances, and net pay</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-white/5 text-xs sm:text-sm pt-0">
            <div className="py-3 flex justify-between">
              <span className="text-slate-400">Basic Salary</span>
              <span className="text-white font-semibold font-mono">
                ${(employee.salary?.basic || 0).toLocaleString()}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-400">House Rent Allowance (HRA)</span>
              <span className="text-white font-semibold font-mono">
                ${(employee.salary?.hra || 0).toLocaleString()}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-400">Special Allowances</span>
              <span className="text-white font-semibold font-mono">
                ${(employee.salary?.allowances || 0).toLocaleString()}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-400">Deductions</span>
              <span className="text-rose-400 font-semibold font-mono">
                -${(employee.salary?.deductions || 0).toLocaleString()}
              </span>
            </div>
            <div className="py-3.5 flex justify-between border-t border-white/10 text-base font-bold bg-surface-high/40 px-3 rounded-xl mt-2">
              <span className="text-white">Estimated Net Monthly</span>
              <span className="text-emerald-400 font-mono">
                $
                {(
                  (employee.salary?.basic || 0) +
                  (employee.salary?.hra || 0) +
                  (employee.salary?.allowances || 0) -
                  (employee.salary?.deductions || 0)
                ).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. Edit Modal Dialog */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={isSelf ? 'Update Contact Information' : 'Update Employee Record'}
        description="Update personal contact information, emergency lines, or administrative role attributes."
        maxWidth="lg"
      >
        {editError && (
          <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{editError}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Phone Number"
            id="input-edit-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1-555-0192"
            icon={<Phone className="w-4 h-4" />}
          />

          <div className="pt-3 border-t border-white/10 space-y-3">
            <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px] font-mono">
              Emergency Contact
            </p>
            <Input
              label="Contact Name"
              id="input-edit-emergency-name"
              value={formData.emergencyName}
              onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
              placeholder="e.g. John Rostova"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Relationship"
                id="input-edit-emergency-relationship"
                value={formData.emergencyRelationship}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyRelationship: e.target.value })
                }
                placeholder="e.g. Spouse"
              />
              <Input
                label="Emergency Phone"
                id="input-edit-emergency-phone"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="+1-555-0199"
              />
            </div>
          </div>

          {!isSelf && (user?.role === UserRole.ADMIN || user?.role === UserRole.HR) && (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <p className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] font-mono">
                Management Governance
              </p>
              <Input
                label="Position / Title"
                id="input-edit-position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Employment Status
                </label>
                <select
                  value={formData.status}
                  id="select-edit-status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="glass-input block w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-100 cursor-pointer focus:outline-none"
                >
                  <option value="ACTIVE" className="bg-[#0f2035]">
                    ACTIVE
                  </option>
                  <option value="PROBATION" className="bg-[#0f2035]">
                    PROBATION
                  </option>
                  <option value="NOTICE" className="bg-[#0f2035]">
                    NOTICE
                  </option>
                  <option value="TERMINATED" className="bg-[#0f2035]">
                    TERMINATED
                  </option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" id="btn-submit-edit-employee" variant="primary" isLoading={editLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
