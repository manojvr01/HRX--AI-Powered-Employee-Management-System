import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  LogOut,
  Sparkles,
  CalendarCheck,
  Palmtree,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Permission, UserRole } from '@hrx/shared';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user, can, logout } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Attendance',
      to: '/attendance',
      icon: CalendarCheck,
      show: true,
    },
    {
      label: 'Leave',
      to: '/leave',
      icon: Palmtree,
      show: true,
    },
    {
      label: user?.role === UserRole.MANAGER ? 'My Team' : 'Employees',
      to: '/employees',
      icon: Users,
      show: can(Permission.EMPLOYEES_READ),
    },
    {
      label: 'Departments',
      to: '/departments',
      icon: Building2,
      show: can(Permission.DEPARTMENTS_READ),
    },
    {
      label: 'Settings',
      to: '/settings',
      icon: Settings,
      show: user?.role === UserRole.ADMIN || can(Permission.SETTINGS_MANAGE),
    },
    {
      label: 'My Profile',
      to: user?.employee?.id ? `/employees/${user.employee.id}` : '/profile',
      icon: UserCheck,
      show: user?.role === UserRole.EMPLOYEE,
    },
  ];

  const roleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    HR: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    MANAGER: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    EMPLOYEE: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  };

  const currentRoleStyle = user ? roleColors[user.role] : roleColors.EMPLOYEE;

  return (
    <aside
      className={`fixed lg:static top-0 left-0 z-40 h-screen transition-all duration-300 flex flex-col glass-panel border-r border-slate-800/80 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {isOpen && (
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              HRX Platform
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Enterprise HRMS
            </p>
          </div>
        )}
      </div>

      {/* Role Badge Indicator */}
      {user && isOpen && (
        <div className="px-5 py-4">
          <div
            className={`px-3 py-2 rounded-xl border ${currentRoleStyle.bg} ${currentRoleStyle.border} flex items-center justify-between`}
          >
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Role
              </p>
              <p className={`text-xs font-bold ${currentRoleStyle.text}`}>{user.role}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
      </nav>

      {/* Footer / User Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={logout}
          id="btn-logout"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
