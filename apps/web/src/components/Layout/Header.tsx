import React, { useState } from 'react';
import { Menu, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { AiAssistantModal } from '../AiAssistantModal';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title = 'HR Management' }) => {
  const { user } = useAuth();
  const [showAiModal, setShowAiModal] = useState(false);

  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 w-full">
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          id="btn-toggle-sidebar"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate max-w-[150px] sm:max-w-none">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* AI Assistant Button */}
        <button
          onClick={() => setShowAiModal(true)}
          id="btn-open-ai-assistant"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-medium transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Notification Bell Center */}
        <NotificationCenter />

        {/* AI Assistant Modal */}
        <AiAssistantModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />

        {/* User Mini Profile */}
        {user && (
          <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-800">
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
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
