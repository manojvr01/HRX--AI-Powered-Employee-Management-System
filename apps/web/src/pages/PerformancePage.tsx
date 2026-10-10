import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { IPerformanceReview, UserRole, PerformanceReviewStatus } from '@hrx/shared';
import { Award, Plus, Sparkles, CheckCircle2, Star, Eye } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="h-7 w-7 text-indigo-400" />
            Performance & Talent Reviews
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Role-scoped performance appraisals, competencies, and AI executive summaries.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-600/20 transition-all text-sm w-fit"
          >
            <Plus className="h-4 w-4" />
            Create Review
          </button>
        )}
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Review Records</h2>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading performance reviews...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No performance reviews recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Cycle / Period</th>
                  <th className="px-6 py-3.5">Rating</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">AI Summary</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviews.map((r) => {
                  const emp = (r.employeeId as any) || {};
                  const empName = emp.firstName ? `${emp.firstName} ${emp.lastName}` : 'Self';
                  return (
                    <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{empName}</div>
                        <div className="text-xs text-slate-400">{emp.employeeCode || emp.position || ''}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">{r.reviewPeriod}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {r.overallRating.toFixed(1)} / 5.0
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            r.status === PerformanceReviewStatus.FINALIZED
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-400">
                        {r.aiSummary ? (
                          <span className="flex items-center gap-1 text-indigo-300">
                            <Sparkles className="h-3.5 w-3.5 shrink-0" />
                            {r.aiSummary.slice(0, 45)}...
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedReview(r)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Performance Appraisal: {selectedReview.reviewPeriod}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rating: <span className="text-amber-400 font-semibold">{selectedReview.overallRating} / 5.0</span> • Status: {selectedReview.status}
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* AI Summary Banner */}
            {selectedReview.aiSummary && (
              <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-800/40 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  Executive AI Performance Summary (Advisory)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedReview.aiSummary}
                </p>
              </div>
            )}

            {/* Ratings Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Competency Ratings</h4>
              <div className="space-y-2">
                {selectedReview.ratings?.map((cat: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium text-white">{cat.category}</div>
                      {cat.comments && <div className="text-xs text-slate-400 mt-0.5">{cat.comments}</div>}
                    </div>
                    <div className="text-amber-400 font-bold">{cat.score} / 5</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative Notes */}
            <div className="grid grid-cols-1 gap-4 text-xs">
              {selectedReview.strengths && (
                <div className="p-3 bg-slate-800/30 rounded border border-slate-800">
                  <span className="font-semibold text-emerald-400 block mb-1">Key Strengths</span>
                  <p className="text-slate-300">{selectedReview.strengths}</p>
                </div>
              )}
              {selectedReview.areasForImprovement && (
                <div className="p-3 bg-slate-800/30 rounded border border-slate-800">
                  <span className="font-semibold text-amber-400 block mb-1">Areas for Development</span>
                  <p className="text-slate-300">{selectedReview.areasForImprovement}</p>
                </div>
              )}
              {selectedReview.goals && (
                <div className="p-3 bg-slate-800/30 rounded border border-slate-800">
                  <span className="font-semibold text-indigo-400 block mb-1">Upcoming Cycle Goals</span>
                  <p className="text-slate-300">{selectedReview.goals}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              {canManage && selectedReview.status === PerformanceReviewStatus.DRAFT && (
                <button
                  onClick={() => handleFinalize(selectedReview._id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalize Review
                </button>
              )}
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Review Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create Performance Review</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Target Employee</label>
                <select
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Review Period</label>
                  <input
                    type="text"
                    value={createForm.reviewPeriod}
                    onChange={(e) => setCreateForm({ ...createForm, reviewPeriod: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    placeholder="e.g. Q4 2026"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Overall Rating (1 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={createForm.overallRating}
                    onChange={(e) => setCreateForm({ ...createForm, overallRating: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Core Strengths</label>
                <textarea
                  value={createForm.strengths}
                  onChange={(e) => setCreateForm({ ...createForm, strengths: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white h-16"
                  placeholder="Key accomplishments and competencies..."
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Areas for Development</label>
                <textarea
                  value={createForm.areasForImprovement}
                  onChange={(e) => setCreateForm({ ...createForm, areasForImprovement: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white h-16"
                  placeholder="Constructive growth recommendations..."
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Goals for Upcoming Cycle</label>
                <textarea
                  value={createForm.goals}
                  onChange={(e) => setCreateForm({ ...createForm, goals: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white h-16"
                  placeholder="Milestones and targeted outcomes..."
                />
              </div>

              {/* AI Draft Assist */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={generatingAi}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generatingAi ? 'Generating...' : 'Generate AI Summary Draft'}
                </button>
                {aiSummaryDraft && (
                  <textarea
                    value={aiSummaryDraft}
                    onChange={(e) => setAiSummaryDraft(e.target.value)}
                    className="mt-2 w-full bg-indigo-950/30 border border-indigo-800/40 rounded-lg p-2.5 text-slate-200 text-xs h-24"
                    placeholder="Advisory AI Summary (editable)..."
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-600/20"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
