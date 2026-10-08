import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useSocket();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="btn-notifications"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="badge-unread-count"
            className="absolute top-1 right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-bold rounded-full bg-indigo-500 text-white ring-2 ring-slate-950 flex items-center justify-center animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="popover-notifications"
          className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl bg-slate-900/95 backdrop-blur-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
                title={isConnected ? 'Real-time connected' : 'Disconnected'}
              />
            </div>
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                onClick={() => markAllAsRead()}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Inbox className="w-8 h-8 text-slate-600" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                  className={`p-3.5 transition cursor-pointer flex gap-3 ${
                    notif.isRead ? 'hover:bg-slate-800/40 opacity-75' : 'bg-indigo-950/20 hover:bg-indigo-950/40'
                  }`}
                >
                  <div className="pt-0.5">
                    <span
                      className={`block w-2 h-2 rounded-full mt-1.5 ${
                        notif.isRead ? 'bg-slate-600' : 'bg-indigo-500 ring-2 ring-indigo-500/20'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${notif.isRead ? 'font-medium text-slate-300' : 'font-bold text-white'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
