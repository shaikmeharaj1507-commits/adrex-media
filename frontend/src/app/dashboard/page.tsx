'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Megaphone, Users, Briefcase, Activity,
  ArrowUpRight, DollarSign, ChevronRight, Sparkles, CheckSquare
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 text-sm shadow-xl text-foreground">
        <p className="text-muted-foreground">{label}</p>
        <p className="text-foreground font-semibold">₹{payload[0].value.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };
const staggerContainer = { animate: { transition: { staggerChildren: 0.06 } } };

function AdminDashboardContent({ user, stats, loading, monthlyRevenue, hasRevenueData, kpiCards, quickLinks, recentActivity, recentCampaigns }: any) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-3xl font-bold tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your agency today.</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div className="grid grid-cols-2 xl:grid-cols-4 gap-4" variants={staggerContainer} initial="initial" animate="animate">
        {kpiCards.map((card: any, i: number) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} variants={fadeIn}
              className={`p-5 rounded-2xl bg-gradient-to-br ${card.bg} border border-border shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-border ${card.color} shadow-sm`}>
                <Icon size={20} />
              </div>
              <p className="text-3xl font-bold text-foreground mt-3">{loading ? '—' : card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div {...fadeIn}
          className="xl:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Revenue Overview</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly invoiced revenue</p>
            </div>
            <Link href="/dashboard/reports" className="text-xs text-primary hover:opacity-80 flex items-center gap-1 transition-colors">
              Full Report <ArrowUpRight size={12} />
            </Link>
          </div>
          {hasRevenueData ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#6E7381', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6E7381', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `₹${(v / 1000).toFixed(0)}k` : '₹0'} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: 'hsl(var(--primary))' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No revenue data yet. Create invoices to see your revenue trend.
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeIn}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickLinks.map((link: any, i: number) => {
              const Icon = link.icon;
              return (
                <Link key={i} href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted border border-border transition-all group">
                  <div className={`w-9 h-9 rounded-lg ${link.color} flex items-center justify-center text-white shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground font-medium transition-colors">{link.label}</span>
                  <ChevronRight size={14} className="ml-auto text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              );
            })}
          </div>

          {/* Revenue Summary */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50/50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-600">Revenue Summary</span>
            </div>
            <p className="text-lg font-bold text-foreground">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total paid invoices</p>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity + Campaigns Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div {...fadeIn}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activity yet. Start creating campaigns, clients, and tasks.</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.slice(0, 6).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${a.color} mt-1.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Campaigns */}
        <motion.div {...fadeIn}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Campaigns</h3>
            <Link href="/dashboard/campaigns" className="text-xs text-primary hover:opacity-80 flex items-center gap-1 transition-colors">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet. Create your first campaign to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.slice(0, 5).map((c: any, i: number) => {
                const statusColors: Record<string, string> = {
                  ACTIVE: 'text-cyan-600 bg-cyan-50 border border-cyan-200',
                  DRAFT: 'text-zinc-600 bg-zinc-50 border border-zinc-200',
                  PLANNED: 'text-primary bg-primary/5 border border-primary/20',
                  COMPLETED: 'text-amber-600 bg-amber-50 border border-amber-200',
                  PAUSED: 'text-rose-600 bg-rose-50 border border-rose-200',
                };
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted transition-all">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">₹{(c.budget || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] || statusColors.DRAFT}`}>
                      {c.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function TeamMemberDashboardContent({ user, stats, loading, recentActivity }: any) {
  return (
    <div className="space-y-6">
      <motion.div {...fadeIn}>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">Here are your active tasks and assignments.</p>
      </motion.div>
      
      {/* KPI Cards for Team Member */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={fadeIn} className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/30 border border-border shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-amber-600 shadow-sm"><Activity size={20} /></div>
          <p className="text-3xl font-bold text-foreground mt-3">{loading ? '-' : (stats.tasks || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">My Open Tasks</p>
        </motion.div>
        <motion.div variants={fadeIn} className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary shadow-sm"><Megaphone size={20} /></div>
          <p className="text-3xl font-bold text-foreground mt-3">{loading ? '-' : (stats.activeCampaigns || 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">Active Campaigns</p>
        </motion.div>
        <motion.div variants={fadeIn} className="col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col justify-center shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="flex gap-4">
            <Link href="/dashboard/tasks" className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted border border-border transition-all">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0"><CheckSquare size={14} /></div>
              <span className="text-sm text-muted-foreground font-medium">View My Tasks</span>
            </Link>
            <Link href="/dashboard/team" className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted border border-border transition-all">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shrink-0"><Users size={14} /></div>
              <span className="text-sm text-muted-foreground font-medium">Team Directory</span>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div {...fadeIn} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Agency Updates</h3>
        {recentActivity && recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity.</p>
        ) : (
          <div className="space-y-4">
            {recentActivity?.slice(0, 5).map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${a.color} mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    campaigns: 0, clients: 0, influencers: 0, tasks: 0,
    activeCampaigns: 0, totalRevenue: 0, totalExpenses: 0, totalMRR: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adrex_token');
    if (!token) { router.push('/login'); return; }
    fetch(`${API_URL}/api/stats/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) {
          setStats(d);
          setMonthlyRevenue(d.monthlyRevenue || []);
          setRecentActivity(d.recentActivity || []);
          setRecentCampaigns(d.recentCampaigns || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const kpiCards = useMemo(() => [
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Megaphone, color: 'text-rose-600', bg: 'from-rose-50 to-rose-100/30' },
    { label: 'Total Clients', value: stats.clients, icon: Briefcase, color: 'text-cyan-600', bg: 'from-cyan-50 to-cyan-100/30' },
    { label: 'Influencers', value: stats.influencers, icon: Users, color: 'text-rose-600', bg: 'from-rose-50 to-rose-100/30' },
    { label: 'Open Tasks', value: stats.tasks, icon: Activity, color: 'text-amber-600', bg: 'from-amber-50 to-amber-100/30' },
  ], [stats]);

  const quickLinks = useMemo(() => [
    { href: '/dashboard/campaigns', label: 'Create Campaign', icon: Megaphone, color: 'bg-rose-500' },
    { href: '/dashboard/influencers', label: 'Add Influencer', icon: Users, color: 'bg-rose-500' },
    { href: '/dashboard/pipeline', label: 'View Pipeline', icon: ArrowUpRight, color: 'bg-primary' },
    { href: '/dashboard/ai', label: 'AI Tools', icon: Sparkles, color: 'bg-gradient-to-r from-primary to-secondary' },
  ], []);

  const hasRevenueData = monthlyRevenue.some(m => m.revenue > 0);

  if (user?.role === 'TEAM_MEMBER') {
    return <TeamMemberDashboardContent user={user} stats={stats} loading={loading} recentActivity={recentActivity} />;
  }

  return (
    <AdminDashboardContent 
      user={user} 
      stats={stats} 
      loading={loading} 
      monthlyRevenue={monthlyRevenue} 
      hasRevenueData={hasRevenueData} 
      kpiCards={kpiCards} 
      quickLinks={quickLinks} 
      recentActivity={recentActivity} 
      recentCampaigns={recentCampaigns} 
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
