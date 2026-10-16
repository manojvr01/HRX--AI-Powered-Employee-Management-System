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
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Organizational Hierarchy
            </span>
            <span className="text-xs text-text-muted">Business Units & Scope</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-primary" />
            Departments & Divisions
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Operational business units, team structures, headcount distribution, and unit leads
          </p>
        </div>

        {can(Permission.DEPARTMENTS_MANAGE) && (
          <Button
            onClick={() => setIsModalOpen(true)}
            id="btn-add-department"
            variant="primary"
            className="shadow-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        )}
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 glass-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center text-text-muted">
          No active departments configured in the organization directory.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="glass-card p-6 rounded-2xl border border-white/[0.08] hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary-light border border-primary/25 flex items-center justify-center font-bold text-sm shadow-glow group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-highest/60 border border-white/[0.08] text-primary-light">
                    {dept.code}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mt-4 group-hover:text-primary-light transition-colors">
                  {dept.name}
                </h2>
                <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                  {dept.description || 'No detailed operational description provided.'}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-secondary/15 flex items-center justify-center text-secondary">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-white font-mono">{dept.employeeCount || 0}</span>
                  <span className="text-text-muted">personnel</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Department Head</span>
                  <span className="text-text-secondary font-medium text-xs">
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Department"
        description="Establish a new business unit and team code for staff classification."
        maxWidth="md"
      >
        {modalError && (
          <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error-light text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-error" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Department Name *
            </label>
            <input
              type="text"
              required
              id="input-department-name"
              placeholder="e.g. Finance & Accounting"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Department Code *
            </label>
            <input
              type="text"
              required
              id="input-department-code"
              placeholder="e.g. FIN"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono uppercase focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              id="textarea-department-description"
              placeholder="Brief description of department responsibility..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              id="btn-submit-create-department"
              variant="primary"
              disabled={modalLoading}
            >
              {modalLoading ? 'Creating...' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

