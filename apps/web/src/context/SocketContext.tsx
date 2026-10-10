import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { INotification } from '@hrx/shared';
import { useAuth } from './AuthContext';
import { getAccessToken, apiRequest } from '../lib/api';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: INotification[];
  unreadCount: number;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiRequest<{ notifications: INotification[]; unreadCount: number }>(
        '/notifications'
      );
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Fail gracefully
    }
  }, [isAuthenticated]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((notification: { _id?: string; title: string; message: string; type?: string }) => {
    const id = notification._id || Math.random().toString();
    const newToast: ToastItem = {
      id,
      title: notification.title,
      message: notification.message,
      type: (notification.type as ToastItem['type']) || 'INFO',
    };
    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 active toasts

    // Auto dismiss after 5s
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  }, [dismissToast]);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  // Manage Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = getAccessToken();
    const envSocketUrl = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
    const serverUrl = envSocketUrl || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

    const newSocket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('notification:new', (notif: INotification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      addToast(notif);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    fetchNotifications();

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id, addToast, fetchNotifications]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        toasts,
        dismissToast,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
      {/* Real-time Toast Overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900/95 border border-indigo-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-md text-white transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {toast.title}
                </p>
                <p className="text-sm font-medium text-slate-200 mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white text-xs p-1"
                aria-label="Dismiss toast"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
