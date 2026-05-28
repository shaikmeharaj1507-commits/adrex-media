'use client';

import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Briefcase, Megaphone,
  CheckSquare, Calendar, BarChart, Settings, LogOut, Zap,
  GitBranch, DollarSign, UserCheck, Sparkles, Folder, Award
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',   href: '/dashboard',         roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER'] },
  { icon: Megaphone,       label: 'Campaigns',   href: '/dashboard/campaigns',roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER'] },
  { icon: Users,           label: 'Influencers', href: '/dashboard/influencers',roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER'] },
  { icon: Briefcase,       label: 'Clients',     href: '/dashboard/clients', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { icon: Users,           label: 'Client Portal', href: '/dashboard/client-portal', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { icon: Award,           label: 'Influencer Portal', href: '/dashboard/influencer-portal', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { icon: GitBranch,       label: 'Pipeline',    href: '/dashboard/pipeline', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { icon: CheckSquare,     label: 'Tasks',       href: '/dashboard/tasks',   roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER'] },
  { icon: UserCheck,       label: 'Team',        href: '/dashboard/team',    roles: ['SUPER_ADMIN', 'MANAGER'] },
  { icon: Calendar,        label: 'Calendar',    href: '/dashboard/calendar', roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER'] },
  { icon: DollarSign,      label: 'Finance',     href: '/dashboard/finance',  roles: ['SUPER_ADMIN', 'MANAGER'] },
  { icon: BarChart,        label: 'Reports',     href: '/dashboard/reports',  roles: ['SUPER_ADMIN', 'MANAGER'] },
  { icon: Folder,          label: 'Files',       href: '/dashboard/files',    roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER'] },
  { icon: Sparkles,        label: 'AI Tools',    href: '/dashboard/ai',      roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || 'TEAM_MEMBER');
  });

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* backend may be offline */ }
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 h-screen bg-card/80 border-r border-border/50 flex flex-col fixed left-0 top-0 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Adrex Media" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gradient">Adrex Media</h2>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5 truncate max-w-[120px]">Agency Workspace</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                active ? 'text-white' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-gradient-to-r from-violet-500/15 to-cyan-500/10 rounded-xl border border-violet-500/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-violet-400 to-cyan-400" />
              )}
              <Icon size={17} className={`relative z-10 transition-colors ${
                active ? 'text-violet-300' : 'group-hover:text-foreground'
              }`} />
              <span className="relative z-10 font-medium text-sm">{item.label}</span>
              {active && <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Bottom */}
      <div className="p-3 border-t border-border/30 space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 mb-1 rounded-xl bg-white/4 border border-white/8">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.firstName?.[0] ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user.role?.replace(/_/g, ' ').toLowerCase()}</p>
            </div>
          </div>
        )}

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <Settings size={17} />
          <span className="font-medium text-sm">Settings</span>
        </Link>

        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut size={17} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
