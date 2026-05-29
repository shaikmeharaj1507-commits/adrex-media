'use client';

import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Briefcase, Megaphone,
  CheckSquare, Calendar, BarChart, Settings, LogOut, Zap,
  GitBranch, DollarSign, UserCheck, Sparkles, Folder, Award,
  ShieldAlert, TrendingUp, Film, Target, Share2, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',   href: '/dashboard',         roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER', 'INFLUENCER_MANAGER', 'SALES_TEAM', 'VIDEO_EDITOR', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER'] },
  { icon: Megaphone,       label: 'Campaigns',   href: '/dashboard/campaigns',roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER', 'INFLUENCER_MANAGER', 'VIDEO_EDITOR', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER'] },
  { icon: Users,           label: 'Influencers', href: '/dashboard/influencers',roles: ['SUPER_ADMIN', 'MANAGER', 'INFLUENCER_MANAGER'] },
  { icon: Briefcase,       label: 'Clients',     href: '/dashboard/clients', roles: ['SUPER_ADMIN', 'MANAGER', 'SALES_TEAM'] },
  { icon: Users,           label: 'Client Portal', href: '/dashboard/client-portal', roles: ['SUPER_ADMIN', 'MANAGER', 'SALES_TEAM'] },
  { icon: Award,           label: 'Influencer Portal', href: '/dashboard/influencer-portal', roles: ['SUPER_ADMIN', 'MANAGER', 'INFLUENCER_MANAGER'] },
  { icon: GitBranch,       label: 'Pipeline',    href: '/dashboard/pipeline', roles: ['SUPER_ADMIN', 'MANAGER', 'SALES_TEAM'] },
  { icon: CheckSquare,     label: 'Tasks',       href: '/dashboard/tasks',   roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER', 'INFLUENCER_MANAGER', 'SALES_TEAM', 'VIDEO_EDITOR', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER'] },
  { icon: UserCheck,       label: 'Team',        href: '/dashboard/team',    roles: ['SUPER_ADMIN', 'MANAGER'] },
  { icon: Calendar,        label: 'Calendar',    href: '/dashboard/calendar', roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER', 'INFLUENCER_MANAGER', 'SALES_TEAM', 'VIDEO_EDITOR', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER'] },
  { icon: DollarSign,      label: 'Finance',     href: '/dashboard/finance',  roles: ['SUPER_ADMIN', 'MANAGER', 'PERFORMANCE_MARKETER'] },
  { icon: BarChart,        label: 'Reports',     href: '/dashboard/reports',  roles: ['SUPER_ADMIN', 'MANAGER', 'SALES_TEAM', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER'] },
  { icon: Folder,          label: 'Files',       href: '/dashboard/files',    roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER', 'INFLUENCER_MANAGER', 'SALES_TEAM', 'VIDEO_EDITOR', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER'] },
  { icon: Sparkles,        label: 'AI Tools',    href: '/dashboard/ai',      roles: ['SUPER_ADMIN', 'MANAGER', 'TEAM_MEMBER', 'INFLUENCER_MANAGER', 'SALES_TEAM', 'VIDEO_EDITOR', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER'] },
];

const roleItems = [
  { id: 'SUPER_ADMIN', label: 'Super Admin', icon: ShieldAlert, color: 'text-purple-400' },
  { id: 'MANAGER', label: 'Manager', icon: Briefcase, color: 'text-blue-400' },
  { id: 'INFLUENCER_MANAGER', label: 'Influencer Manager', icon: Sparkles, color: 'text-violet-400' },
  { id: 'SALES_TEAM', label: 'Sales Team', icon: TrendingUp, color: 'text-cyan-400' },
  { id: 'VIDEO_EDITOR', label: 'Video Editor', icon: Film, color: 'text-rose-400' },
  { id: 'PERFORMANCE_MARKETER', label: 'Performance Marketer', icon: Target, color: 'text-amber-400' },
  { id: 'SOCIAL_MEDIA_MANAGER', label: 'Social Media Manager', icon: Share2, color: 'text-emerald-400' },
  { id: 'INFLUENCER', label: 'Influencer', icon: UserCheck, color: 'text-pink-400' },
  { id: 'TEAM_MEMBER', label: 'General / Team Member', icon: Users, color: 'text-slate-400' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [showRolesMenu, setShowRolesMenu] = useState(true);

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
    <aside className="w-64 h-[calc(100vh-2rem)] m-4 rounded-3xl bg-black/60 backdrop-blur-[20px] border border-white/10 shadow-2xl flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
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
                  className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl shadow-[0_8px_20px_rgba(124,92,255,0.25)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-white" />
              )}
              <Icon size={17} className={`relative z-10 transition-colors ${
                active ? 'text-white' : 'group-hover:text-foreground'
              }`} />
              <span className="relative z-10 font-medium text-sm">{item.label}</span>
              {active && <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-4 border-t border-white/5" />

        {/* Roles Section */}
        <div className="space-y-1">
          <button
            onClick={() => setShowRolesMenu(!showRolesMenu)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-all"
          >
            <span>Workspace Roles</span>
            {showRolesMenu ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {showRolesMenu && (
            <div className="space-y-0.5 mt-1 max-h-[220px] overflow-y-auto pr-1">
              {roleItems.map((role) => {
                const RoleIcon = role.icon;
                const isSelected = user?.role === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      if (user) {
                        setUser({ ...user, role: role.id });
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/20 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <RoleIcon size={14} className={role.color} />
                    <span className="text-xs truncate">{role.label}</span>
                    {isSelected && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User + Bottom */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {((user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && !pathname.includes('/client-portal/')) && (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Settings size={17} />
            <span className="font-medium text-sm">Settings</span>
          </Link>
        )}

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
