'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, Briefcase, Shield, TrendingUp, Film, Target, Share2,
  Sparkles, UserCheck, ShieldAlert, ChevronRight, X, Activity,
  Mail, Calendar, CheckSquare, Megaphone, Clock, RefreshCw,
  Circle, BarChart2, UserCog
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import AccessRestricted from '@/components/AccessRestricted';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  bio?: string;
  phone?: string;
}

interface MemberStats {
  taskCount: number;
  completedTasks: number;
  campaignCount: number;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  SUPER_ADMIN:          { label: 'Super Admin',          color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/25',  Icon: ShieldAlert },
  MANAGER:              { label: 'Manager',              color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/25',      Icon: Briefcase },
  INFLUENCER_MANAGER:   { label: 'Influencer Manager',  color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/25',  Icon: Sparkles },
  SALES_TEAM:           { label: 'Sales Team',           color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/25',      Icon: TrendingUp },
  VIDEO_EDITOR:         { label: 'Video Editor',         color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/25',      Icon: Film },
  PERFORMANCE_MARKETER: { label: 'Perf. Marketer',       color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/25',    Icon: Target },
  SOCIAL_MEDIA_MANAGER: { label: 'Social Manager',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', Icon: Share2 },
  INFLUENCER:           { label: 'Influencer',           color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/25',      Icon: UserCheck },
  TEAM_MEMBER:          { label: 'Team Member',          color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/25',    Icon: Users },
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/25', Icon: Shield };
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-zinc-600'}`} />
  );
}

function AvatarCircle({ firstName, lastName, size = 'md' }: { firstName: string; lastName: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-sm' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-11 h-11 text-base';
  const initials = getInitials(firstName, lastName);
  // Deterministic color based on initials
  const colors = ['from-violet-500 to-blue-500', 'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-cyan-500 to-blue-500', 'from-purple-500 to-violet-500'];
  const color = colors[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length];
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
      {initials}
    </div>
  );
}

export default function WorkspacePage() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'MANAGER') {
    return <AccessRestricted />;
  }

  const fetchTeam = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTeam(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMemberStats = useCallback(async (memberId: string) => {
    setLoadingStats(true);
    setMemberStats(null);
    try {
      const token = localStorage.getItem('adrex_token');
      // Fetch tasks assigned to this member
      const [tasksRes, campaignsRes] = await Promise.all([
        fetch(`${API_URL}/api/tasks?assignedTo=${memberId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/campaigns`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const campaigns = campaignsRes.ok ? await campaignsRes.json() : [];
      setMemberStats({
        taskCount: Array.isArray(tasks) ? tasks.length : 0,
        completedTasks: Array.isArray(tasks) ? tasks.filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length : 0,
        campaignCount: Array.isArray(campaigns) ? campaigns.length : 0,
      });
    } catch { setMemberStats(null); } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  useEffect(() => {
    if (selectedMember) fetchMemberStats(selectedMember.id);
  }, [selectedMember, fetchMemberStats]);

  const roles = ['All', ...Array.from(new Set(team.map(m => m.role)))];

  const filteredTeam = team.filter(m => {
    const matchSearch = `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const activeCount = team.filter(m => m.isActive).length;
  const roleBreakdown = team.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
              <UserCog size={20} className="text-white" />
            </div>
            Workspace Monitor
          </h1>
          <p className="text-muted-foreground mt-1">Real-time team monitoring & performance hub</p>
        </div>
        <button
          onClick={() => fetchTeam(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-all"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: team.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Active Now', value: activeCount, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Roles Covered', value: Object.keys(roleBreakdown).length, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Inactive', value: team.length - activeCount, icon: Circle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphism rounded-2xl p-4 border border-border/60 shadow-sm flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={kpi.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Team List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/80 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 bg-muted/50 border border-border/80 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            >
              {roles.map(r => (
                <option key={r} value={r} className="bg-background text-foreground">
                  {r === 'All' ? 'All Roles' : (ROLE_CONFIG[r]?.label ?? r)}
                </option>
              ))}
            </select>
          </div>

          {/* Team Cards */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-2xl" />
              ))}
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No team members found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTeam.map((member, i) => {
                const isSelected = selectedMember?.id === member.id;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedMember(isSelected ? null : member)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all group ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(124,92,255,0.1)]'
                        : 'border-border/60 bg-card hover:border-primary/25 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <AvatarCircle firstName={member.firstName} lastName={member.lastName} />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${member.isActive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          <ChevronRight
                            size={16}
                            className={`text-muted-foreground shrink-0 transition-transform ${isSelected ? 'rotate-90 text-primary' : 'group-hover:translate-x-0.5'}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <RoleBadge role={member.role} />
                          <span className={`text-[10px] font-medium ${member.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {member.isActive ? '● Active' : '○ Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedMember ? (
              <motion.div
                key={selectedMember.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="glassmorphism rounded-2xl border border-border/60 shadow-sm overflow-hidden sticky top-20"
              >
                {/* Panel Header */}
                <div className="p-5 border-b border-border/40 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <AvatarCircle firstName={selectedMember.firstName} lastName={selectedMember.lastName} size="lg" />
                      <div>
                        <p className="font-bold text-foreground">{selectedMember.firstName} {selectedMember.lastName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <StatusDot isActive={selectedMember.isActive} />
                          <span className={`text-xs ${selectedMember.isActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                            {selectedMember.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <RoleBadge role={selectedMember.role} />
                </div>

                {/* Contact Info */}
                <div className="p-5 space-y-3 border-b border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact</p>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail size={14} className="text-primary shrink-0" />
                    <span className="text-foreground truncate">{selectedMember.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar size={14} className="text-primary shrink-0" />
                    <span className="text-muted-foreground">
                      Joined {new Date(selectedMember.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  {selectedMember.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <span className="text-primary text-base shrink-0">📱</span>
                      <span className="text-foreground">{selectedMember.phone}</span>
                    </div>
                  )}
                  {selectedMember.bio && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-xl p-3 border border-border/40">
                      {selectedMember.bio}
                    </p>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="p-5 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Performance</p>
                  {loadingStats ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <div key={i} className="h-12 skeleton rounded-xl" />)}
                    </div>
                  ) : memberStats ? (
                    <div className="space-y-3">
                      {[
                        { icon: CheckSquare, label: 'Total Tasks', value: memberStats.taskCount, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { icon: Activity, label: 'Completed', value: memberStats.completedTasks, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { icon: Megaphone, label: 'Campaigns', value: memberStats.campaignCount, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                      ].map(stat => {
                        const Icon = stat.icon;
                        return (
                          <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <Icon size={13} className={stat.color} />
                              </div>
                              <span className="text-sm text-muted-foreground">{stat.label}</span>
                            </div>
                            <span className="text-sm font-bold text-foreground">{stat.value}</span>
                          </div>
                        );
                      })}

                      {/* Completion Rate bar */}
                      {memberStats.taskCount > 0 && (
                        <div className="p-3 rounded-xl border border-border/50 bg-muted/30 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Task Completion</span>
                            <span className="font-bold text-foreground">
                              {Math.round((memberStats.completedTasks / memberStats.taskCount) * 100)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(memberStats.completedTasks / memberStats.taskCount) * 100}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Stats unavailable</p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 pb-5">
                  <a
                    href={`mailto:${selectedMember.email}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
                  >
                    <Mail size={15} /> Send Email
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glassmorphism rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center py-20 px-8 text-center sticky top-20"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart2 size={28} className="text-primary" />
                </div>
                <p className="font-semibold text-foreground mb-1">Select a Member</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click any team member to view their profile, performance stats, and activity details.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Role Distribution */}
      {!loading && Object.keys(roleBreakdown).length > 0 && (
        <div className="glassmorphism rounded-2xl border border-border/60 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield size={14} />
            Role Distribution
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(roleBreakdown).map(([role, count]) => {
              const cfg = ROLE_CONFIG[role] ?? { label: role, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/25', Icon: Shield };
              const { Icon } = cfg;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(roleFilter === role ? 'All' : role)}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                    roleFilter === role
                      ? `${cfg.bg} border-current ${cfg.color}`
                      : 'bg-muted/30 border-border/50 hover:border-primary/25'
                  }`}
                >
                  <Icon size={22} className={roleFilter === role ? cfg.color : 'text-muted-foreground'} />
                  <span className="text-xl font-bold text-foreground mt-1">{count}</span>
                  <span className={`text-[10px] mt-0.5 font-medium text-center leading-tight ${roleFilter === role ? cfg.color : 'text-muted-foreground'}`}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
