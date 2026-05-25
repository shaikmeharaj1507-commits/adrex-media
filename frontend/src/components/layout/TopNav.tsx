'use client';

import { Bell, Search, ChevronDown, Settings, LogOut, User, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface BackendNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function TopNav() {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { socket } = useSocketStore();
  const router = useRouter();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: BackendNotification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = async () => {
      await fetchNotifications();
    };

    socket.on('receive_notification', handleNewNotification);
    return () => {
      socket.off('receive_notification', handleNewNotification);
    };
  }, [socket, fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('adrex_token');
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Admin';
  const displayEmail = user?.email ?? 'admin@adrexmedia.com';
  const displayInitial = displayName[0]?.toUpperCase() ?? 'D';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          id="global-search"
          type="text"
          placeholder="Search campaigns, clients..."
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all placeholder:text-zinc-600 text-white"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl hover:bg-white/8 dark:hover:bg-white/8 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-white transition-all"
        >
          <Sun size={19} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon size={19} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-btn"
            onClick={() => { setShowNotifs(p => !p); setShowProfile(false); if (!showNotifs) fetchNotifications(); }}
            className="relative p-2 rounded-xl hover:bg-white/8 text-zinc-400 hover:text-white transition-all"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-purple-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 z-50 w-96 max-h-[480px] flex flex-col rounded-2xl border border-white/15 shadow-2xl overflow-hidden backdrop-blur-2xl bg-zinc-900/95 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
                <span className="text-sm font-semibold text-white">Notifications</span>
                <span className="text-xs text-purple-400 font-medium">{unreadCount} unread</span>
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-zinc-500">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} onClick={() => markAsRead(n.id)} className={`px-4 py-3 border-b border-white/8 last:border-0 hover:bg-white/5 transition-all cursor-pointer ${!n.isRead ? 'bg-purple-500/8' : ''}`}>
                      <div className="flex items-start gap-2.5">
                        {!n.isRead && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0" />}
                        {n.isRead && <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" />}
                        <div>
                          {n.title && <p className="text-xs font-medium text-purple-300">{n.title}</p>}
                          <p className="text-sm text-white leading-snug">{n.message}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {unreadCount > 0 && (
                <div className="px-4 py-2.5 border-t border-white/10 shrink-0">
                  <button onClick={markAllAsRead} className="text-xs text-purple-400 hover:text-purple-300 transition-colors w-full text-center">Mark all as read</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-btn"
            onClick={() => { setShowProfile(p => !p); setShowNotifs(false); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/8 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {displayInitial}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-none text-white">{displayName}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{user?.role ?? 'Super Admin'}</p>
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/15 shadow-2xl overflow-hidden backdrop-blur-2xl bg-zinc-900/95 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {displayInitial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                    <p className="text-xs text-zinc-500">{displayEmail}</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                {[
                  { label: 'Profile Settings', icon: User, href: '/dashboard/settings' },
                  { label: 'Agency Settings', icon: Settings, href: '/dashboard/settings?tab=agency' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-white/8 transition-all text-zinc-300 hover:text-white"
                    >
                      <Icon size={14} className="text-zinc-500" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="border-t border-white/10 p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 transition-all text-red-400 hover:text-red-300"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
