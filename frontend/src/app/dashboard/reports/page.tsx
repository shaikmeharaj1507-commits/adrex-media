'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Users, Megaphone, Download, FileText, PieChart, Activity, Calendar, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm shadow-xl">
        <p className="text-zinc-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {typeof p.value === 'number' ? `₹${p.value.toLocaleString('en-IN')}` : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

type TimelineOption = 'last7' | 'last30' | 'last6m' | 'custom';

const TIMELINE_OPTIONS: { label: string; value: TimelineOption }[] = [
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'Last 6 Months', value: 'last6m' },
  { label: 'Custom Range', value: 'custom' },
];

function getDateRange(option: TimelineOption, customStart?: string, customEnd?: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  switch (option) {
    case 'last7':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'last30':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      break;
    case 'last6m':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'custom':
      startDate = customStart ? new Date(customStart) : new Date(now.setMonth(now.getMonth() - 1));
      return { startDate, endDate: customEnd ? new Date(customEnd) : new Date() };
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
  }

  return { startDate, endDate };
}

export default function ReportsPage() {
  const [stats, setStats] = useState({
    campaigns: 0, clients: 0, influencers: 0, tasks: 0,
    totalRevenue: 0, totalExpenses: 0, totalAdSpend: 0, activeCampaigns: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Timeline state
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineOption>('last6m');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showTimelineDropdown, setShowTimelineDropdown] = useState(false);
  const [showCustomPickers, setShowCustomPickers] = useState(false);

  const fetchStats = useCallback(async (timeline: TimelineOption, cs?: string, ce?: string) => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(timeline, cs, ce);
    const token = localStorage.getItem('adrex_token');
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    try {
      const res = await fetch(`${API_URL}/api/stats/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (d) {
        setStats(d);
        setMonthlyData(d.monthlyData || []);
        setChannelData(d.channelData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(selectedTimeline, customStart, customEnd);
  }, []);

  const handleTimelineSelect = (value: TimelineOption) => {
    setSelectedTimeline(value);
    setShowTimelineDropdown(false);
    if (value === 'custom') {
      setShowCustomPickers(true);
    } else {
      setShowCustomPickers(false);
      fetchStats(value);
    }
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    fetchStats('custom', customStart, customEnd);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Active Campaigns', stats.activeCampaigns],
      ['Total Clients', stats.clients],
      ['Influencers', stats.influencers],
      ['Open Tasks', stats.tasks],
      ['Total Revenue (₹)', stats.totalRevenue],
      ['Total Expenses (₹)', stats.totalExpenses],
      ['Total Campaign Budget (₹)', stats.totalAdSpend],
      [],
      ['Month', 'Revenue', 'Expenses'],
      ...monthlyData.map(m => [m.month, m.revenue, m.expenses]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adrex-report-${selectedTimeline}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedTimelineLabel = TIMELINE_OPTIONS.find(t => t.value === selectedTimeline)?.label ?? 'Last 6 Months';
  const hasRevenueData = monthlyData.some(m => m.revenue > 0);
  const hasExpenseData = monthlyData.some(m => m.expenses > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Performance overview and business insights.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeline Filter */}
          <div className="relative">
            <button
              onClick={() => setShowTimelineDropdown(!showTimelineDropdown)}
              id="timeline-filter-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-all text-sm"
            >
              <Calendar size={15} className="text-purple-400" />
              {selectedTimelineLabel}
              <ChevronDown size={15} className={`transition-transform ${showTimelineDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showTimelineDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden">
                {TIMELINE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    id={`timeline-${opt.value}`}
                    onClick={() => handleTimelineSelect(opt.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/5 ${selectedTimeline === opt.value ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            id="export-csv-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/20 transition-all text-sm"
          >
            <Download size={15} /> Export CSV
          </button>

          {/* PDF Export */}
          <button
            onClick={() => {
              const t = localStorage.getItem('adrex_token');
              window.open(`${API_URL}/api/pdf/report?token=${t}`, '_blank');
            }}
            id="export-pdf-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-all text-sm"
          >
            <FileText size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Custom Date Range Pickers */}
      {showCustomPickers && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glassmorphism rounded-2xl p-5"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Start Date</label>
              <input
                type="date"
                id="custom-start-date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">End Date</label>
              <input
                type="date"
                id="custom-end-date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <button
              id="apply-custom-range-btn"
              onClick={applyCustomRange}
              disabled={!customStart || !customEnd}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Apply Range
            </button>
          </div>
        </motion.div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Megaphone, color: 'text-purple-400' },
          { label: 'Total Clients', value: stats.clients, icon: Users, color: 'text-blue-400' },
          { label: 'Influencers', value: stats.influencers, icon: Activity, color: 'text-emerald-400' },
          { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: FileText, color: 'text-amber-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="p-5 rounded-2xl glassmorphism flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}><s.icon size={22} /></div>
            <div><p className="text-xs text-zinc-400">{s.label}</p><p className="text-2xl font-bold text-white">{loading ? '—' : s.value}</p></div>
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
          {hasRevenueData || hasExpenseData ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `₹${(v/1000).toFixed(0)}k` : '₹0'} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-zinc-500 text-sm">
              No financial data for this period. Try a wider date range.
            </div>
          )}
        </motion.div>

        <motion.div className="glassmorphism rounded-2xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-white">Financial Summary</h3>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Total Revenue (Paid)', value: stats.totalRevenue, color: 'bg-emerald-500' },
              { label: 'Total Expenses', value: stats.totalExpenses, color: 'bg-red-500' },
              { label: 'Total Campaign Budget', value: stats.totalAdSpend, color: 'bg-purple-500' },
            ].map((m, i) => {
              const maxVal = Math.max(stats.totalRevenue, stats.totalExpenses, stats.totalAdSpend, 1);
              const pct = (m.value / maxVal) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-zinc-400">{m.label}</span>
                    <span className="text-white font-semibold">₹{m.value.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className={`h-full ${m.color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: 'easeOut' }} />
                  </div>
                </div>
              );
            })}
            {stats.totalRevenue > 0 && stats.totalExpenses > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm font-semibold text-emerald-400">Net Profit</p>
                <p className="text-2xl font-bold text-white mt-1">₹{(stats.totalRevenue - stats.totalExpenses).toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Expense Distribution + Key Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div className="glassmorphism rounded-2xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={18} className="text-blue-400" />
            <h3 className="font-semibold text-white">Expense by Category</h3>
          </div>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => <span className="text-zinc-300 text-sm">{v}</span>} />
                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']} contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-zinc-500 text-sm">
              No expense categories for this period.
            </div>
          )}
        </motion.div>

        <motion.div className="glassmorphism rounded-2xl p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2 mb-6">
            <Activity size={18} className="text-amber-400" />
            <h3 className="font-semibold text-white">Agency Overview</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Total Campaigns', value: stats.campaigns, icon: Megaphone },
              { label: 'Active Campaigns', value: stats.activeCampaigns, icon: TrendingUp },
              { label: 'Total Clients', value: stats.clients, icon: Users },
              { label: 'Influencers', value: stats.influencers, icon: Activity },
              { label: 'Open Tasks', value: stats.tasks, icon: FileText },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
                      <Icon size={14} />
                    </div>
                    <span className="text-sm text-zinc-300">{m.label}</span>
                  </div>
                  <span className="text-lg font-bold text-white">{loading ? '—' : m.value}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
