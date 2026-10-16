import React, { useState } from 'react';
import { Menu, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { AiAssistantModal } from '../AiAssistantModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title = 'Executive Overview' }) => {
  const { user } = useAuth();
  const [showAiModal, setShowAiModal] = useState(false);

  return (
    <header className="h-16 bg-surface-lowest/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 w-full shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
      {/* Left: Sidebar Toggle & Search / Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          id="btn-toggle-sidebar"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Stitch design) */}
        <div className="relative w-full max-w-md hidden sm:block">
          <input
            type="text"
            placeholder="Search employees, policies, reports..."
            className="w-full h-9 pl-9 pr-12 rounded-xl bg-surface-container border border-white/10 text-slate-200 placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-high border border-white/10 text-[10px] text-slate-400 font-mono font-semibold">
            ⌘K
          </div>
        </div>

        <h2 className="text-sm sm:text-base font-bold text-white truncate sm:hidden">
          {title}
        </h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Copilot Active Indicator (Stitch design) */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium font-mono">HRX Copilot Active</span>
        </div>

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={() => setShowAiModal(true)}
          id="btn-open-ai-assistant"
          className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white shadow-glow-primary border border-indigo-400/30 text-xs font-semibold transition-all shrink-0 active:scale-95"
          title="Ask HRX Copilot"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span className="hidden sm:inline">Ask Copilot</span>
        </button>

        {/* Notification Bell Center */}
        <NotificationCenter />

        {/* AI Assistant Modal */}
        <AiAssistantModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />

        {/* User Mini Profile */}
        {user && (
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-white/10">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xs overflow-hidden shrink-0">
                {user.employee?.avatarUrl ? (
                  <img
                    src={user.employee.avatarUrl}
                    alt={user.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-surface-lowest" />
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-100 truncate max-w-[120px] leading-tight">
                {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email}
              </span>
              <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider leading-tight">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
