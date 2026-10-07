import React from 'react';
import { Menu, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title = 'HR Management' }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          id="btn-toggle-sidebar"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          id="btn-notifications"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-950" />
        </button>

        {/* User Mini Profile */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xs overflow-hidden">
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
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200">
                {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email}
              </p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
