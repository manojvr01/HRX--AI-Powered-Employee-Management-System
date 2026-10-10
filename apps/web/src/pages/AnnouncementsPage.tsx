import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Megaphone, Plus, Bell, Calendar, Tag } from 'lucide-react';
import { UserRole, IAnnouncement } from '@hrx/shared';

export function AnnouncementsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [targetRole, setTargetRole] = useState<'ALL' | 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE'>('ALL');

  const canPost = user?.role === UserRole.ADMIN || user?.role === UserRole.HR;

  useEffect(() => {
    fetchAnnouncements();

    if (socket) {
      socket.on('announcement:new', (newAnn: IAnnouncement) => {
        setAnnouncements((prev) => [newAnn, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('announcement:new');
      }
    };
  }, [socket]);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const res = await api.get<IAnnouncement[]>('/announcements');
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/announcements', {
        title,
        content,
        priority,
        targetRole,
      });
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      await fetchAnnouncements();
    } catch (err: any) {
      alert(err?.message || 'Failed to post announcement');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-indigo-400" />
            Company Announcements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time organizational updates, policy releases, and executive broadcasts.
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-600/20 transition-all text-sm w-fit"
          >
            <Plus className="h-4 w-4" />
            Post Announcement
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
            No announcements broadcasted yet.
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      ann.priority === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : ann.priority === 'LOW'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {ann.priority} Priority
                  </span>
                  <h3 className="text-base font-bold text-white">{ann.title}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                  {ann.targetRole && (
                    <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded">
                      <Tag className="h-3 w-3" />
                      Audience: {ann.targetRole}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              {ann.authorName && (
                <div className="text-[11px] text-slate-500 pt-1">
                  Posted by <span className="text-slate-400 font-medium">{ann.authorName}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Post Announcement</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Headline</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  placeholder="e.g. Q4 Town Hall Meeting & Review Timelines"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH (Urgent)</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="EMPLOYEE">Employees Only</option>
                    <option value="MANAGER">Managers Only</option>
                    <option value="HR">HR Team</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Message Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white h-28"
                  placeholder="Details of the announcement..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-md shadow-indigo-600/20"
                >
                  Broadcast Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
