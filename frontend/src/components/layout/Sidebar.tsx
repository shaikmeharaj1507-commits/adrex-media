'use client';

import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Briefcase, Megaphone,
  CheckSquare, Calendar, BarChart, Settings, LogOut, Zap,
  GitBranch, DollarSign, UserCheck, Sparkles, Folder, Award,
  ShieldAlert, TrendingUp, Film, Target, Share2,
  ChevronDown, ChevronRight, Monitor, Eye, X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',         href: '/dashboard',                    roles: ['SUPER_ADMIN','MANAGER','TEAM_MEMBER','INFLUENCER_MANAGER','SALES_TEAM','VIDEO_EDITOR','PERFORMANCE_MARKETER','SOCIAL_MEDIA_MANAGER'] },
  { icon: Megaphone,       label: 'Campaigns',          href: '/dashboard/campaigns',           roles: ['SUPER_ADMIN','MANAGER','TEAM_MEMBER','INFLUENCER_MANAGER','VIDEO_EDITOR','PERFORMANCE_MARKETER','SOCIAL_MEDIA_MANAGER'] },
  { icon: Users,           label: 'Influencers',        href: '/dashboard/influencers',         roles: ['SUPER_ADMIN','MANAGER','INFLUENCER_MANAGER'] },
  { icon: Briefcase,       label: 'Clients',            href: '/dashboard/clients',             roles: ['SUPER_ADMIN','MANAGER','SALES_TEAM'] },
  { icon: Award,           label: 'Client Portal',      href: '/dashboard/client-portal',       roles: ['SUPER_ADMIN','MANAGER','SALES_TEAM'] },
  { icon: UserCheck,       label: 'Influencer Portal',  href: '/dashboard/influencer-portal',   roles: ['SUPER_ADMIN','MANAGER','INFLUENCER_MANAGER'] },
  { icon: GitBranch,       label: 'Pipeline',           href: '/dashboard/pipeline',            roles: ['SUPER_ADMIN','MANAGER','SALES_TEAM'] },
  { icon: CheckSquare,     label: 'Tasks',              href: '/dashboard/tasks',               roles: ['SUPER_ADMIN','MANAGER','TEAM_MEMBER','INFLUENCER_MANAGER','SALES_TEAM','VIDEO_EDITOR','PERFORMANCE_MARKETER','SOCIAL_MEDIA_MANAGER'] },
  { icon: Monitor,         label: 'Workspace',          href: '/dashboard/workspace',           roles: ['SUPER_ADMIN','MANAGER'] },
  { icon: Users,           label: 'Team',               href: '/dashboard/team',                roles: ['SUPER_ADMIN','MANAGER'] },
  { icon: Calendar,        label: 'Calendar',           href: '/dashboard/calendar',            roles: ['SUPER_ADMIN','MANAGER','TEAM_MEMBER','INFLUENCER_MANAGER','SALES_TEAM','VIDEO_EDITOR','PERFORMANCE_MARKETER','SOCIAL_MEDIA_MANAGER'] },
  { icon: DollarSign,      label: 'Finance',            href: '/dashboard/finance',             roles: ['SUPER_ADMIN','MANAGER','PERFORMANCE_MARKETER'] },
  { icon: BarChart,        label: 'Reports',            href: '/dashboard/reports',             roles: ['SUPER_ADMIN','MANAGER','SALES_TEAM','PERFORMANCE_MARKETER','SOCIAL_MEDIA_MANAGER'] },
  { icon: Folder,          label: 'Files',              href: '/dashboard/files',               roles: ['SUPER_ADMIN','MANAGER','TEAM_MEMBER','INFLUENCER_MANAGER','SALES_TEAM','VIDEO_EDITOR','PERFORMANCE_MARKETER','SOCIAL_MEDIA_MANAGER'] },
  { icon: Sparkles,        label: 'AI Tools',           href: '/dashboard/ai',                  roles: ['SUPER_ADMIN','MANAGER','TEAM_MEMBER','INFLUENCER_MANAGER','SALES_TEAM','VIDEO_EDITOR','PERFORMANCE_MARKETER','SOCIAL_MEDIA_MANAGER'] },
];

const roleItems = [
  { id: 'SUPER_ADMIN',          label: 'Super Admin',           icon: ShieldAlert, color: 'text-purple-400' },
  { id: 'MANAGER',              label: 'Manager',               icon: Briefcase,   color: 'text-blue-400' },
  { id: 'INFLUENCER_MANAGER',   label: 'Influencer Manager',    icon: Sparkles,    color: 'text-violet-400' },
  { id: 'SALES_TEAM',           label: 'Sales Team',            icon: TrendingUp,  color: 'text-cyan-400' },
  { id: 'VIDEO_EDITOR',         label: 'Video Editor',          icon: Film,        color: 'text-rose-400' },
  { id: 'PERFORMANCE_MARKETER', label: 'Performance Marketer',  icon: Target,      color: 'text-amber-400' },
  { id: 'SOCIAL_MEDIA_MANAGER', label: 'Social Media Manager',  icon: Share2,      color: 'text-emerald-400' },
  { id: 'INFLUENCER',           label: 'Influencer',            icon: UserCheck,   color: 'text-pink-400' },
  { id: 'TEAM_MEMBER',          label: 'General Member',        icon: Users,       color: 'text-slate-400' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, workspaceRole, setWorkspaceRole } = useAuthStore();
  const [showRolesMenu, setShowRolesMenu] = useState(false);

  // Use workspaceRole for NAV FILTER PREVIEW, but never for permission enforcement
  // Admin identity (user.role) is always preserved
  const activeRole = workspaceRole ?? user?.role ?? 'TEAM_MEMBER';

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(activeRole);
  });

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* backend may be offline */ }
    logout();
    router.push('/login');
  };

  const selectedRoleItem = roleItems.find(r => r.id === workspaceRole);

  return (
    <aside className="w-64 h-[calc(100vh-2rem)] m-4 rounded-3xl flex flex-col fixed left-0 top-0 z-40 overflow-hidden"
      style={{
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--sidebar-border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-gradient">Adrex Media</h2>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Agency Workspace</p>
          </div>
        </div>
      </div>

      {/* Workspace Role Preview Banner */}
      <AnimatePresence>
        {workspaceRole && workspaceRole !== user?.role && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="workspace-preview-bar shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-1.5">
                <Eye size={11} className="text-primary" />
                <span className="text-[10px] font-semibold text-primary">Previewing:</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                  {selectedRoleItem?.label ?? workspaceRole}
                </span>
              </div>
              <button
                onClick={() => setWorkspaceRole(null)}
                className="p-0.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                title="Exit preview mode"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-sm ${
                active ? 'text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-500 rounded-xl shadow-[0_6px_20px_rgba(124,92,255,0.3)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-white/80" />
              )}
              <Icon size={16} className={`relative z-10 shrink-0 transition-colors ${active ? 'text-white' : 'group-hover:text-foreground'}`} />
              <span className="relative z-10 font-medium truncate">{item.label}</span>
              {active && <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-3 border-t border-border/40" />

        {/* Workspace Role Viewer — Preview what a role would see */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
          <div className="space-y-1">
            <button
              onClick={() => setShowRolesMenu(!showRolesMenu)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors rounded-lg hover:bg-muted/40"
            >
              <span>Role Preview</span>
              <motion.div animate={{ rotate: showRolesMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showRolesMenu && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 max-h-48 overflow-y-auto pr-0.5 pb-1">
                    {/* Reset option */}
                    <button
                      onClick={() => setWorkspaceRole(null)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all text-[11px] ${
                        !workspaceRole
                          ? 'bg-primary/10 border border-primary/25 text-primary font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <ShieldAlert size={12} className="text-purple-400 shrink-0" />
                      <span className="truncate">My Role ({user?.role?.replace(/_/g, ' ')})</span>
                      {!workspaceRole && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    </button>

                    {roleItems.filter(r => r.id !== user?.role).map((role) => {
                      const RoleIcon = role.icon;
                      const isSelected = workspaceRole === role.id;
                      return (
                        <button
                          key={role.id}
                          onClick={() => setWorkspaceRole(isSelected ? null : role.id)}
                          title={`Preview ${role.label} perspective`}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all text-[11px] ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/25 text-primary font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                          }`}
                        >
                          <RoleIcon size={12} className={`${role.color} shrink-0`} />
                          <span className="truncate">{role.label}</span>
                          {isSelected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-border/40 space-y-0.5 shrink-0">
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && !pathname.includes('/client-portal/') && (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-sm"
          >
            <Settings size={16} />
            <span className="font-medium">Settings</span>
          </Link>
        )}
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all text-sm"
        >
          <LogOut size={16} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
