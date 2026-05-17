'use client';

import { Bell, Search, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

const dropdownBase = "absolute right-0 top-12 z-50 rounded-2xl border border-white/15 shadow-2xl overflow-hidden backdrop-blur-2xl bg-zinc-900/95";

export default function TopNav() {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', text: 'Task "Draft contracts" is overdue', time: '3h ago', unread: true },
    { id: '2', text: 'Client NovaTech added $10K to budget', time: '1h ago', unread: false },
  ]);
  const { user, logout } = useAuthStore();
  const { socket } = useSocketStore();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (notif: any) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        text: notif.text,
        time: 'Just now',
        unread: true
      }, ...prev]);
    };

    socket.on('receive_notification', handleNewNotification);
    return () => {
      socket.off('receive_notification', handleNewNotification);
    };
  }, [socket]);

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
        {/* Notifications */}
        <div className="relative">
          <button
            id="notif-btn"
            onClick={() => { setShowNotifs(p => !p); setShowProfile(false); }}
            className="relative p-2 rounded-xl hover:bg-white/8 text-zinc-400 hover:text-white transition-all"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
          </button>

          <AnimatePresence>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className={`${dropdownBase} w-80`}
                >
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    <span className="text-xs text-purple-400 font-medium">{notifications.filter(n => n.unread).length} unread</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} onClick={() => setNotifications(prev => prev.map(p => p.id === n.id ? { ...p, unread: false } : p))} className={`px-4 py-3 border-b border-white/8 last:border-0 hover:bg-white/5 transition-all cursor-pointer ${n.unread ? 'bg-purple-500/8' : ''}`}>
                        <div className="flex items-start gap-2.5">
                          {n.unread && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0" />}
                          {!n.unread && <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" />}
                          <div>
                            <p className="text-sm text-white leading-snug">{n.text}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="px-4 py-2.5 border-t border-white/10">
                    <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors w-full text-center">Mark all as read</button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Profile */}
        <div className="relative">
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

          <AnimatePresence>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className={`${dropdownBase} w-56`}
                >
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
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
