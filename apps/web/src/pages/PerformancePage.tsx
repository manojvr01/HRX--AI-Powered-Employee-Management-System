import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { IPerformanceReview, UserRole, PerformanceReviewStatus } from '@hrx/shared';
import { Award, Plus, Sparkles, CheckCircle2, Star, Eye, ChevronRight, TrendingUp, Target } from 'lucide-react';
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

export function PerformancePage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<IPerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedReview, setSelectedReview] = useState<IPerformanceReview | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    reviewPeriod: 'Q4 2026',
    overallRating: 4,
    ratings: [
      { category: 'Technical Execution', score: 4, comments: 'Consistent delivery on team priorities.' },
      { category: 'Collaboration & Communication', score: 4, comments: 'Supportive team partner.' },
      { category: 'Ownership & Initiative', score: 4, comments: 'Takes proactive ownership of problems.' },
    ],
    strengths: '',
    areasForImprovement: '',
    goals: '',
    status: PerformanceReviewStatus.DRAFT,
  });
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiSummaryDraft, setAiSummaryDraft] = useState('');

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.HR || user?.role === UserRole.MANAGER;

  useEffect(() => {
    fetchReviews();
    if (canManage) {
      fetchEmployees();
    }
  }, [user]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await api.get<IPerformanceReview[]>('/performance');
      setReviews(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load performance reviews');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmployees() {
    try {
      const res = await api.get<any[]>('/employees');
      const list = res.data || [];
      setEmployees(list);
      if (list.length > 0 && !createForm.employeeId) {
        setCreateForm((prev) => ({ ...prev, employeeId: list[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load employees for review creation', err);
    }
  }

  async function handleCreateReview(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/performance', {
        ...createForm,
        aiSummary: aiSummaryDraft || undefined,
      });
      setShowCreateModal(false);
      setAiSummaryDraft('');
      await fetchReviews();
    } catch (err: any) {
      alert(err?.message || 'Failed to create review');
    }
  }

  async function handleGenerateAiDraft() {
    setGeneratingAi(true);
    try {
      const selectedEmp = employees.find((e) => e._id === createForm.employeeId);
      const empName = selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : 'Employee';
      const position = selectedEmp?.position || 'Team Member';

      // Local generative preview
      const preview =
        `During the ${createForm.reviewPeriod} cycle, ${empName} (${position}) exhibited dependable performance with an overall rating of ${createForm.overallRating}/5.0.\n\n` +
        `Noted Strengths: ${createForm.strengths || 'High collaboration and accountability'}. ` +
        `Growth Focus: ${createForm.areasForImprovement || 'Continued expansion of leadership scope'}. ` +
        `Upcoming Targets: ${createForm.goals || 'Execution against core quarterly deliverables'}.`;
      setAiSummaryDraft(preview);
    } finally {
      setGeneratingAi(false);
    }
  }

  async function handleFinalize(reviewId: string) {
    if (!confirm('Are you sure you want to finalize this review? The employee will immediately be able to view it.')) return;
    try {
      await api.patch(`/performance/${reviewId}`, { status: PerformanceReviewStatus.FINALIZED });
      await fetchReviews();
      if (selectedReview?._id === reviewId) {
        setSelectedReview((prev: any) => prev ? { ...prev, status: PerformanceReviewStatus.FINALIZED } : null);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to finalize review');
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Talent Management & Growth
            </span>
            <span className="text-xs text-text-muted">OKR & Appraisal Alignment</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Award className="h-7 w-7 text-primary" />
            Performance & Talent Reviews
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Role-scoped performance appraisals, competencies, and AI executive summaries
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="shadow-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Review
          </Button>
        )}
      </div>

      {/* Reviews Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Review Records</CardTitle>
              <CardDescription>
                Historical and active evaluation cycles with qualitative analysis
              </CardDescription>
            </div>
            <Badge variant="neutral">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-text-muted font-mono text-xs">
              Loading performance reviews...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-error font-medium text-xs">{error}</div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center text-text-muted text-xs">
              No performance reviews recorded yet for this view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-text-muted font-mono uppercase text-[11px]">
                    <th className="py-3.5 px-5">Employee</th>
                    <th className="py-3.5 px-5">Cycle / Period</th>
                    <th className="py-3.5 px-5">Rating</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">AI Summary</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {reviews.map((r) => {
                    const emp = (r.employeeId as any) || {};
                    const empName = emp.firstName ? `${emp.firstName} ${emp.lastName}` : 'Self';
                    return (
                      <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light font-bold text-xs uppercase flex-shrink-0">
                              {empName.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-white">{empName}</div>
                              <div className="text-[11px] text-text-muted font-mono">
                                {emp.employeeCode || emp.position || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-text-secondary font-mono">
                          {r.reviewPeriod}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5 text-tertiary font-bold font-mono">
                            <Star className="h-4 w-4 fill-tertiary text-tertiary" />
                            {r.overallRating.toFixed(1)} / 5.0
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <Badge
                            variant={
                              r.status === PerformanceReviewStatus.FINALIZED
                                ? 'success'
                                : 'warning'
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-5 max-w-xs truncate text-text-muted">
                          {r.aiSummary ? (
                            <span className="flex items-center gap-1 text-primary-light font-medium">
                              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                              {r.aiSummary.slice(0, 45)}...
                            </span>
                          ) : (
                            <span className="text-text-muted/60 italic">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReview(r)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Details Modal */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title={selectedReview ? `Appraisal: ${selectedReview.reviewPeriod}` : ''}
        description={
          selectedReview
            ? `Score: ${selectedReview.overallRating} / 5.0 • Status: ${selectedReview.status}`
            : ''
        }
        maxWidth="xl"
      >
        {selectedReview && (
          <div className="space-y-5 text-xs">
            {/* AI Summary Banner */}
            {selectedReview.aiSummary && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-[11px]">
                  <Sparkles className="h-4 w-4" />
                  Executive AI Appraisal Synthesis (Advisory)
                </div>
                <p className="text-text-secondary leading-relaxed whitespace-pre-line text-xs">
                  {selectedReview.aiSummary}
                </p>
              </div>
            )}

            {/* Ratings Breakdown */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase text-text-muted tracking-wider">
                Competency Assessment
              </h4>
              <div className="space-y-2">
                {selectedReview.ratings?.map((cat: any, idx: number) => {
                  const percent = Math.min(100, Math.round((cat.score / 5) * 100));
                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-surface-highest/40 rounded-xl border border-white/[0.06] space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{cat.category}</div>
                          {cat.comments && (
                            <div className="text-[11px] text-text-muted mt-0.5">
                              {cat.comments}
                            </div>
                          )}
                        </div>
                        <div className="text-tertiary font-bold font-mono text-sm">
                          {cat.score} / 5
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Qualitative Notes */}
            <div className="grid grid-cols-1 gap-3">
              {selectedReview.strengths && (
                <div className="p-3.5 bg-surface-container/60 rounded-xl border border-white/[0.06]">
                  <span className="font-bold text-secondary block mb-1">Key Strengths</span>
                  <p className="text-text-secondary leading-relaxed">{selectedReview.strengths}</p>
                </div>
              )}
              {selectedReview.areasForImprovement && (
                <div className="p-3.5 bg-surface-container/60 rounded-xl border border-white/[0.06]">
                  <span className="font-bold text-tertiary block mb-1">Areas for Development</span>
                  <p className="text-text-secondary leading-relaxed">{selectedReview.areasForImprovement}</p>
                </div>
              )}
              {selectedReview.goals && (
                <div className="p-3.5 bg-surface-container/60 rounded-xl border border-white/[0.06]">
                  <span className="font-bold text-primary-light block mb-1">Next Cycle Targets & Objectives</span>
                  <p className="text-text-secondary leading-relaxed">{selectedReview.goals}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
              {canManage && selectedReview.status === PerformanceReviewStatus.DRAFT && (
                <Button
                  onClick={() => handleFinalize(selectedReview._id)}
                  variant="secondary"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Finalize Review
                </Button>
              )}
              <Button
                onClick={() => setSelectedReview(null)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Review Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Performance Review"
        description="Initiate a periodic talent evaluation with competency scoring and AI drafting assistance."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReview} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Target Employee *</label>
            <select
              value={createForm.employeeId}
              onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
              required
            >
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id} className="bg-surface-darker text-white">
                  {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.position || 'Staff'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Review Period *</label>
              <input
                type="text"
                value={createForm.reviewPeriod}
                onChange={(e) => setCreateForm({ ...createForm, reviewPeriod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
                placeholder="e.g. Q4 2026"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Overall Rating (1 - 5) *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={createForm.overallRating}
                onChange={(e) => setCreateForm({ ...createForm, overallRating: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-primary transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Core Strengths</label>
            <textarea
              value={createForm.strengths}
              onChange={(e) => setCreateForm({ ...createForm, strengths: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary transition h-16"
              placeholder="Key accomplishments and competencies..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Areas for Development</label>
            <textarea
              value={createForm.areasForImprovement}
              onChange={(e) => setCreateForm({ ...createForm, areasForImprovement: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary transition h-16"
              placeholder="Constructive growth recommendations..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Goals for Upcoming Cycle</label>
            <textarea
              value={createForm.goals}
              onChange={(e) => setCreateForm({ ...createForm, goals: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary transition h-16"
              placeholder="Milestones and targeted outcomes..."
            />
          </div>

          {/* AI Draft Assist */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerateAiDraft}
              disabled={generatingAi}
              className="flex items-center gap-1.5 text-xs text-primary-light hover:text-white bg-primary/10 border border-primary/25 px-3 py-1.5 rounded-xl transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {generatingAi ? 'Generating...' : 'Generate AI Summary Draft'}
            </button>
            {aiSummaryDraft && (
              <textarea
                value={aiSummaryDraft}
                onChange={(e) => setAiSummaryDraft(e.target.value)}
                className="mt-2 w-full bg-primary/5 border border-primary/20 rounded-xl p-3 text-white text-xs h-24 focus:outline-none focus:border-primary"
                placeholder="Advisory AI Summary (editable)..."
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Save Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

