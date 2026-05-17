'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Megaphone, Users, Briefcase, DollarSign,
  TrendingUp, Activity, ArrowUpRight, Zap, Bell, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

const revenueData = [
  { month: 'Jan', revenue: 24000 },
  { month: 'Feb', revenue: 31000 },
  { month: 'Mar', revenue: 28000 },
  { month: 'Apr', revenue: 39000 },
  { month: 'May', revenue: 45000 },
  { month: 'Jun', revenue: 52000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm shadow-xl">
        <p className="text-zinc-400">{label}</p>
        <p className="text-white font-semibold">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ campaigns: 0, clients: 0, influencers: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adrex_token');
    if (!token) { router.push('/login'); return; }
    fetch('http://localhost:5000/api/stats/dashboard', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d && !d.error) setStats(d); })
      .catch(console.error).finally(() => setLoading(false));
  }, [router]);

  const kpiCards = [
    { label: 'Active Campaigns', value: stats.campaigns, icon: Megaphone, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-500/5', change: '+12%' },
    { label: 'Total Clients', value: stats.clients, icon: Briefcase, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5', change: '+8%' },
    { label: 'Influencers', value: stats.influencers, icon: Users, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5', change: '+23%' },
    { label: 'Open Tasks', value: stats.tasks, icon: Activity, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5', change: '-5%' },
  ];

  const quickLinks = [
    { href: '/dashboard/campaigns', label: 'Create Campaign', icon: Megaphone, color: 'bg-purple-500' },
    { href: '/dashboard/influencers', label: 'Add Influencer', icon: Users, color: 'bg-blue-500' },
    { href: '/dashboard/pipeline', label: 'View Pipeline', icon: TrendingUp, color: 'bg-emerald-500' },
    { href: '/dashboard/ai', label: 'AI Tools', icon: Sparkles, color: 'bg-gradient-to-r from-purple-500 to-blue-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your agency today.</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`p-5 rounded-2xl bg-gradient-to-br ${card.bg} border border-white/10 relative overflow-hidden`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${card.color}`}>
                  <Icon size={20} />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.change.startsWith('+') ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {card.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{loading ? '—' : card.value}</p>
              <p className="text-sm text-zinc-400 mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="xl:col-span-2 glassmorphism rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Revenue Overview</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Monthly performance for 2025</p>
            </div>
            <Link href="/dashboard/reports" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
              Full Report <ArrowUpRight size={12} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#8b5cf6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="glassmorphism rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickLinks.map((link, i) => {
              const Icon = link.icon;
              return (
                <Link key={i} href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group">
                  <div className={`w-9 h-9 rounded-lg ${link.color} flex items-center justify-center text-white shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-white font-medium transition-colors">{link.label}</span>
                  <ChevronRight size={14} className="ml-auto text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </Link>
              );
            })}
          </div>

          {/* AI Tip */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 border border-purple-500/25">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-purple-400" />
              <span className="text-xs font-semibold text-purple-400">AI Insight</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">Your top campaign this month hit 4.6x ROAS. Try the AI Strategy tool to replicate this success.</p>
          </div>
        </motion.div>
      </div>

      {/* ROAS + Activity Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ROAS Metric */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="glassmorphism rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">ROAS Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Instagram Campaigns', roas: 4.8, pct: 80, color: 'bg-purple-500' },
              { label: 'TikTok Campaigns', roas: 5.2, pct: 87, color: 'bg-pink-500' },
              { label: 'YouTube Campaigns', roas: 3.6, pct: 60, color: 'bg-red-500' },
              { label: 'Performance Ads', roas: 3.1, pct: 52, color: 'bg-blue-500' },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-zinc-400">{m.label}</span>
                  <span className="text-white font-bold">{m.roas}x</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className={`h-full ${m.color} rounded-full`}
                    initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="glassmorphism rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New campaign created', detail: 'Summer Collection 2025', time: '2 min ago', color: 'bg-purple-500' },
              { action: 'Influencer added', detail: '@sarah.lifestyle (142K)', time: '18 min ago', color: 'bg-blue-500' },
              { action: 'Invoice paid', detail: 'FashionBrand Co. — $8,500', time: '1 hr ago', color: 'bg-emerald-500' },
              { action: 'Task completed', detail: 'Brief 5 influencers for Q3', time: '3 hr ago', color: 'bg-amber-500' },
              { action: 'New client onboarded', detail: 'TechStart Pvt. Ltd.', time: '1 day ago', color: 'bg-pink-500' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${a.color} mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 font-medium">{a.action}</p>
                  <p className="text-xs text-zinc-500 truncate">{a.detail}</p>
                </div>
                <span className="text-xs text-zinc-600 whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
