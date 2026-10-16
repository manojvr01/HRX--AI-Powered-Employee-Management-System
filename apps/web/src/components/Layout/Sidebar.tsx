import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Receipt,
  FileText,
  Award,
  BarChart3,
  Megaphone,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Permission, UserRole } from '@hrx/shared';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, can, logout } = useAuth();
  const location = useLocation();

  // Auto-close drawer on mobile whenever navigating to a new route
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && isOpen) {
      onToggle();
    }
  }, [location.pathname]);

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
      label: 'Payroll',
      to: '/payroll',
      icon: Receipt,
      show: user?.role !== UserRole.MANAGER,
    },
    {
      label: 'Documents',
      to: '/documents',
      icon: FileText,
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
      label: 'Performance',
      to: '/performance',
      icon: Award,
      show: true,
    },
    {
      label: 'Announcements',
      to: '/announcements',
      icon: Megaphone,
      show: true,
    },
    {
      label: 'Analytics & Reports',
      to: '/reports',
      icon: BarChart3,
      show: can(Permission.REPORTS_READ),
    },
    {
      label: 'Audit Logs',
      to: '/audit-logs',
      icon: ShieldAlert,
      show: user?.role === UserRole.ADMIN,
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
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onToggle}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen transition-all duration-300 flex flex-col bg-surface-low/95 backdrop-blur-2xl border-r border-white/10 ${
          isOpen
            ? 'translate-x-0 w-72 shadow-2xl lg:shadow-[0_1px_8px_rgba(0,0,0,0.35)]'
            : '-translate-x-full lg:translate-x-0 lg:w-20'
        } ${isOpen ? 'lg:w-72' : 'lg:w-20'} lg:static`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-1 ring-white/20 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-lg tracking-tight text-white font-mono">
                  HR<span className="text-indigo-400">X</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-surface-highest text-indigo-300 border border-indigo-500/20 tracking-wider">
                  Enterprise
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {isOpen && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold tracking-wider font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI
              </span>
            )}
            {/* Collapse / Close Button */}
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              title={isOpen ? 'Collapse' : 'Expand'}
            >
              <X className="w-5 h-5 lg:hidden" />
            </button>
          </div>
        </div>

        {/* Role Badge Indicator */}
        {user && isOpen && (
          <div className="px-4 py-3">
            <div
              className={`px-3.5 py-2 rounded-xl border ${currentRoleStyle.bg} ${currentRoleStyle.border} flex items-center justify-between backdrop-blur-md`}
            >
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Active Role
                </p>
                <p className={`text-xs font-bold ${currentRoleStyle.text}`}>{user.role}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024 && isOpen) {
                      onToggle();
                    }
                  }}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-surface-highest/90 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border-l-2 border-indigo-400'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-indigo-300 transition-colors" />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </div>
                </NavLink>
              );
            })}
        </nav>

        {/* System Sync / Footer */}
        {isOpen && (
          <div className="p-4 mx-3 mb-2 rounded-xl bg-surface-lowest/70 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">System Sync</span>
              <span className="text-emerald-400 font-mono font-semibold">Live (18ms)</span>
            </div>
            <div className="h-1.5 w-full bg-surface-highest rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" style={{ width: '94%' }} />
            </div>
          </div>
        )}

        {/* Footer / User Profile & Logout */}
        <div className="p-3 border-t border-white/10">
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
    </>
  );
};
