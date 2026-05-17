'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, MessageSquare, User, LogOut, Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
  { icon: CheckSquare, label: 'My Tasks', href: '/dashboard/tasks' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    const token = localStorage.getItem('adrex_token');
    if (token) connect(token);
    return () => disconnect();
  }, [connect, disconnect]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 h-screen bg-card/80 border-r border-border/50 flex flex-col fixed left-0 top-0 backdrop-blur-xl z-40">
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gradient">Adrex Media</h2>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Team Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
              >
                {active && (
                  <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/15 rounded-xl border border-primary/25" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <Icon size={17} className={`relative z-10 transition-colors ${active ? 'text-primary' : 'group-hover:text-foreground'}`} />
                <span className="relative z-10 font-medium text-sm">{item.label}</span>
                {active && <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/30 space-y-1">
          {user && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 mb-1 rounded-xl bg-white/3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.firstName?.[0] ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{user.firstName} {user.lastName}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.role?.replace(/_/g, ' ').toLowerCase()}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all">
            <LogOut size={17} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-lg font-semibold text-white">Welcome, {user?.firstName}</h1>
        </header>
        <main className="flex-1 p-8 pt-6">{children}</main>
      </div>
    </div>
  );
}
