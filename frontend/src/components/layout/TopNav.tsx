'use client';

import { Bell, Search, ChevronDown, Settings, LogOut, User, IndianRupee, Globe } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface BackendNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const notifTypeColors: Record<string, string> = {
  SUCCESS: 'bg-emerald-500',
  ERROR:   'bg-red-500',
  WARNING: 'bg-amber-500',
  INFO:    'bg-blue-500',
};

export default function TopNav() {
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, currencyFormat, setCurrencyFormat } = useAuthStore();
  const { socket } = useSocketStore();
  const router = useRouter();
  const notifRef   = useRef<HTMLDivElement>(null);
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

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handler = async () => { await fetchNotifications(); };
    socket.on('receive_notification', handler);
    return () => { socket.off('receive_notification', handler); };
  }, [socket, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('adrex_token');
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMs / 3600000);
    const d = Math.floor(diffMs / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };

  const displayName   = user ? `${user.firstName} ${user.lastName}`.trim() : 'Admin';
  const displayEmail  = user?.email ?? '';
  const displayInitial = displayName[0]?.toUpperCase() ?? 'A';

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-5 sticky top-0 z-30 transition-colors duration-300">

      {/* Search */}
      <div className="relative w-64">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          id="global-search"
          type="text"
          placeholder="Search campaigns, clients..."
          className="w-full pl-9 pr-4 py-1.5 bg-muted/50 border border-border/80 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground text-foreground"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">

        {/* Currency Format Toggle */}
        {user && (
          <button
            id="currency-format-btn"
            onClick={() => setCurrencyFormat(currencyFormat === 'IN' ? 'INTL' : 'IN')}
            title={currencyFormat === 'IN' ? 'Switch to International (K/M/B)' : 'Switch to Indian (K/L/Cr)'}
            className="h-8 px-2.5 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold border border-border/80 hover:border-primary/40 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            {currencyFormat === 'IN'
              ? <><IndianRupee size={13} /><span className="hidden sm:inline">IN</span></>
              : <><Globe size={13} /><span className="hidden sm:inline">INTL</span></>
            }
          </button>
        )}

        {/* Theme Toggle */}
        {user && <ThemeSwitcher size="sm" />}

        {/* Divider */}
        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-btn"
            onClick={() => { setShowNotifs(p => !p); setShowProfile(false); if (!showNotifs) fetchNotifications(); }}
            className="relative h-8 w-8 rounded-xl inline-flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 bg-primary rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 z-50 w-80 max-h-[420px] flex flex-col rounded-2xl border border-border/80 shadow-2xl overflow-hidden bg-background/95 backdrop-blur-2xl text-foreground animate-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between shrink-0">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary hover:opacity-80">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell size={28} className="text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`w-full px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-all text-left ${!n.isRead ? 'bg-primary/4' : ''}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.isRead ? notifTypeColors[n.type] || 'bg-primary' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        {n.title && <p className="text-xs font-semibold text-primary truncate">{n.title}</p>}
                        <p className="text-xs text-foreground leading-snug mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border/60" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-btn"
            onClick={() => { setShowProfile(p => !p); setShowNotifs(false); }}
            className="flex items-center gap-2 h-8 px-2 rounded-xl hover:bg-muted transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              {displayInitial}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-foreground leading-tight">{displayName}</p>
              <p className="text-[9px] text-muted-foreground">{user?.role?.replace(/_/g, ' ') ?? ''}</p>
            </div>
            <ChevronDown size={13} className="text-muted-foreground hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl border border-border/80 shadow-2xl overflow-hidden bg-background/95 backdrop-blur-2xl text-foreground animate-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow">
                    {displayInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
                  </div>
                </div>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                  {user?.role?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="py-1">
                <Link href="/dashboard/settings" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                  <Settings size={14} /> Settings
                </Link>
                <Link href="/dashboard/settings?tab=profile" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                  <User size={14} /> My Profile
                </Link>
              </div>
              <div className="border-t border-border/50 py-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-all">
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
