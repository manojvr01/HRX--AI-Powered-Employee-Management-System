import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Megaphone, Plus, Bell, Calendar, Tag, Radio } from 'lucide-react';
import { UserRole, IAnnouncement } from '@hrx/shared';
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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'HIGH':
        return <Badge variant="danger">High Priority</Badge>;
      case 'LOW':
        return <Badge variant="neutral">Low Priority</Badge>;
      default:
        return <Badge variant="primary">Normal Priority</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Company-Wide Channel
            </span>
            <span className="text-xs text-text-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Live WebSocket Sync
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Megaphone className="h-7 w-7 text-primary" />
            Company Announcements
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time organizational updates, policy releases, and executive broadcasts
          </p>
        </div>

        {canPost && (
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="shadow-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post Announcement
          </Button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-text-muted font-mono text-xs glass-card">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <Card className="p-12 text-center text-text-muted">
            No announcements broadcasted yet in the organization channel.
          </Card>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann._id}
              className="glass-card p-6 rounded-2xl border border-white/[0.08] hover:border-primary/40 transition-all duration-300 space-y-4 group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-3">
                  {getPriorityBadge(ann.priority)}
                  <h3 className="text-base font-bold text-white group-hover:text-primary-light transition-colors">
                    {ann.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-text-secondary" />
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                  {ann.targetRole && (
                    <span className="flex items-center gap-1 font-mono text-[10px] bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md text-text-secondary">
                      <Tag className="h-3 w-3 text-primary-light" />
                      Audience: {ann.targetRole}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              {ann.authorName && (
                <div className="text-[11px] text-text-muted pt-1 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary-light flex items-center justify-center font-bold text-[10px]">
                    {ann.authorName[0]}
                  </div>
                  <span>
                    Posted by <strong className="text-white">{ann.authorName}</strong>
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Broadcast Announcement"
        description="Publish a company-wide or role-targeted executive announcement."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Headline *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
              placeholder="e.g. Q4 Town Hall Meeting & Review Timelines"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
              >
                <option value="NORMAL" className="bg-surface-darker text-white">Normal</option>
                <option value="HIGH" className="bg-surface-darker text-white">High (Urgent)</option>
                <option value="LOW" className="bg-surface-darker text-white">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Target Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
              >
                <option value="ALL" className="bg-surface-darker text-white">All Roles</option>
                <option value="EMPLOYEE" className="bg-surface-darker text-white">Employees Only</option>
                <option value="MANAGER" className="bg-surface-darker text-white">Managers Only</option>
                <option value="HR" className="bg-surface-darker text-white">HR Team</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Message Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary transition h-28"
              placeholder="Detailed content of the announcement..."
              required
            />
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
              Broadcast Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

