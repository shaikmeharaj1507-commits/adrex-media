'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Users, Megaphone, Download, FileText, PieChart, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const monthlyData = [
  { month: 'Jan', revenue: 24000, expenses: 12000 },
  { month: 'Feb', revenue: 31000, expenses: 14000 },
  { month: 'Mar', revenue: 28000, expenses: 11500 },
  { month: 'Apr', revenue: 39000, expenses: 16000 },
  { month: 'May', revenue: 45000, expenses: 18000 },
  { month: 'Jun', revenue: 52000, expenses: 21000 },
];

const roasData = [
  { month: 'Jan', roas: 2.8 },
  { month: 'Feb', roas: 3.2 },
  { month: 'Mar', roas: 2.9 },
  { month: 'Apr', roas: 3.8 },
  { month: 'May', roas: 4.1 },
  { month: 'Jun', roas: 4.6 },
];

const platformData = [
  { name: 'Instagram', value: 45 },
  { name: 'TikTok', value: 30 },
  { name: 'YouTube', value: 15 },
  { name: 'Twitter', value: 10 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm shadow-xl">
        <p className="text-zinc-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {typeof p.value === 'number' && p.name !== 'roas' ? `₹${p.value.toLocaleString('en-IN')}` : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [stats, setStats] = useState({ campaigns: 0, clients: 0, influencers: 0, tasks: 0 });

  useEffect(() => {
    const token = localStorage.getItem('adrex_token');
    fetch(`${API_URL}/api/stats/reports`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d) setStats(d); }).catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Performance overview and business insights.</p>
        </div>
        <button onClick={() => window.open(`${API_URL}/api/pdf/report`, '_blank')} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all text-sm">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: stats.campaigns, icon: Megaphone, color: 'text-purple-400' },
          { label: 'Total Clients', value: stats.clients, icon: Users, color: 'text-blue-400' },
          { label: 'Influencers', value: stats.influencers, icon: Activity, color: 'text-emerald-400' },
          { label: 'Open Tasks', value: stats.tasks, icon: FileText, color: 'text-amber-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="p-5 rounded-2xl glassmorphism flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}><s.icon size={22} /></div>
            <div><p className="text-xs text-zinc-400">{s.label}</p><p className="text-2xl font-bold text-white">{s.value}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div className="glassmorphism rounded-2xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={18} className="text-purple-400" />
            <h3 className="font-semibold text-white">Revenue vs Expenses</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glassmorphism rounded-2xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-white">ROAS Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={roasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 6]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="roas" name="roas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Platform Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div className="glassmorphism rounded-2xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={18} className="text-blue-400" />
            <h3 className="font-semibold text-white">Platform Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie data={platformData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend formatter={(v) => <span className="text-zinc-300 text-sm">{v}</span>} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Share']} contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
            </RechartsPie>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glassmorphism rounded-2xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-6">
            <Activity size={18} className="text-amber-400" />
            <h3 className="font-semibold text-white">Key Metrics Summary</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Average Campaign ROAS', value: '4.6x', pct: 76, color: 'bg-purple-500' },
              { label: 'Campaign Success Rate', value: '84%', pct: 84, color: 'bg-emerald-500' },
              { label: 'Client Retention Rate', value: '91%', pct: 91, color: 'bg-blue-500' },
              { label: 'Team Productivity', value: '78%', pct: 78, color: 'bg-amber-500' },
              { label: 'Influencer Engagement Avg.', value: '6.2%', pct: 62, color: 'bg-pink-500' },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-zinc-400">{m.label}</span>
                  <span className="text-white font-semibold">{m.value}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className={`h-full ${m.color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
