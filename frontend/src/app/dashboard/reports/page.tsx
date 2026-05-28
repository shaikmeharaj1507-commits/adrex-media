'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart2, TrendingUp, Users, Megaphone, Download, FileText, 
  PieChart, Activity, Calendar, ChevronDown, CheckSquare, Sparkles,
  ArrowUpRight, ArrowDownRight, Award, Calculator, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#F43F5E', '#E2B857', '#94A3B8'];
const CAMPAIGN_COLORS = {
  ACTIVE: '#06B6D4',      // Hyper Cyan
  DRAFT: '#94A3B8',       // Subtext Gray
  PLANNED: '#6D28D9',     // Electric Violet
  COMPLETED: '#E2B857',   // Enterprise Gold
  PAUSED: '#F43F5E'       // Creator Pink
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm shadow-xl">
        <p className="text-zinc-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === 'number' && p.name !== 'Completed Tasks' && p.name !== 'Campaigns' 
              ? `₹${p.value.toLocaleString('en-IN')}` 
              : p.value}
          </p>
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
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'influencers' | 'finance'>('overview');
  
  const [stats, setStats] = useState({
    campaigns: 0, clients: 0, influencers: 0, tasks: 0,
    totalRevenue: 0, totalExpenses: 0, totalAdSpend: 0, activeCampaigns: 0,
    revenueGrowthRate: 0,
    campaignStatusBreakdown: [] as { status: string; count: number }[],
    topInfluencersByRating: [] as { id: string; name: string; rating: number; niche: string | null; instagram: string | null; tiktok: string | null }[],
    taskCompletionTrend: [] as { week: string; completed: number }[],
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

  // ROI Estimator States
  const [roiBudget, setRoiBudget] = useState('100000');
  const [roiReachMultiplier, setRoiReachMultiplier] = useState('8'); // 8 views per rupee
  const [roiConvRate, setRoiConvRate] = useState('1.5'); // 1.5% conversions
  const [roiAov, setRoiAov] = useState('1200'); // ₹1200 order value

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

  // ROI calculations
  const parsedBudget = parseFloat(roiBudget) || 0;
  const parsedReachMult = parseFloat(roiReachMultiplier) || 0;
  const parsedConvRate = parseFloat(roiConvRate) || 0;
  const parsedAov = parseFloat(roiAov) || 0;

  const estimatedReach = parsedBudget * parsedReachMult;
  const estimatedConversions = Math.round(estimatedReach * (parsedConvRate / 100));
  const estimatedRevenue = estimatedConversions * parsedAov;
  const estimatedROI = parsedBudget > 0 ? ((estimatedRevenue - parsedBudget) / parsedBudget) * 100 : 0;

  const selectedTimelineLabel = TIMELINE_OPTIONS.find(t => t.value === selectedTimeline)?.label ?? 'Last 6 Months';
  const hasRevenueData = monthlyData.some(m => m.revenue > 0);
  const hasExpenseData = monthlyData.some(m => m.expenses > 0);

  return (
    <div className="space-y-6">
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
              <Calendar size={15} className="text-primary" />
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
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/5 ${selectedTimeline === opt.value ? 'text-primary bg-primary/10' : 'text-zinc-300'}`}
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

      {/* Tab Switcher */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'influencers', label: 'Influencers', icon: Users },
          { id: 'finance', label: 'Finance', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 relative ${
                isSelected 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {isSelected && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Megaphone, color: 'text-rose-400' },
                  { label: 'Total Clients', value: stats.clients, icon: Users, color: 'text-cyan-400' },
                  { label: 'Influencers', value: stats.influencers, icon: Activity, color: 'text-rose-400' },
                  { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: FileText, color: 'text-amber-400' },
                ].map((s, i) => (
                  <div key={i} className="p-5 rounded-2xl glassmorphism flex items-center gap-4 border border-white/5 shadow-sm">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}><s.icon size={22} /></div>
                    <div>
                      <p className="text-xs text-zinc-400">{s.label}</p>
                      <p className="text-2xl font-bold text-white mt-0.5">{loading ? '—' : s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Revenue vs Expenses */}
                <div className="glassmorphism rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart2 size={18} className="text-primary" />
                    <h3 className="font-semibold text-white">Revenue vs Expenses Trend</h3>
                  </div>
                  {hasRevenueData || hasExpenseData ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `₹${(v/1000).toFixed(0)}k` : '₹0'} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--secondary))" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-zinc-500 text-sm">
                      No financial data for this period.
                    </div>
                  )}
                </div>

                {/* Task Completion Line Area */}
                <div className="glassmorphism rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-6">
                    <CheckSquare size={18} className="text-emerald-400" />
                    <h3 className="font-semibold text-white">Weekly Deliverables Completed</h3>
                  </div>
                  {stats.taskCompletionTrend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={stats.taskCompletionTrend}>
                        <defs>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [`${value} Tasks`, 'Completed Tasks']} contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                        <Area type="monotone" dataKey="completed" name="Completed Tasks" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-zinc-500 text-sm">
                      No deliverables progress recorded.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row stats */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Expense Pie */}
                <div className="glassmorphism rounded-2xl p-6 border border-white/5 xl:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <PieChart size={18} className="text-blue-400" />
                      <h3 className="font-semibold text-white">Operational Expenses Breakdown</h3>
                    </div>
                  </div>
                  {channelData.length > 0 ? (
                    <div className="flex flex-col md:flex-row items-center justify-around gap-4 h-[250px]">
                      <div className="w-[180px] h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                              {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']} contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }} />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 text-xs">
                        {channelData.map((d, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-zinc-400 font-medium">{d.name}:</span>
                            <span className="text-white font-bold">₹{d.value.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-zinc-500 text-sm">
                      No expense records logged.
                    </div>
                  )}
                </div>

                {/* Quick Agency Metrics */}
                <div className="glassmorphism rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity size={18} className="text-amber-400" />
                    <h3 className="font-semibold text-white">Agency Operations</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Campaigns Total', value: stats.campaigns, icon: Megaphone },
                      { label: 'Active Projects', value: stats.activeCampaigns, icon: TrendingUp },
                      { label: 'Clients Managed', value: stats.clients, icon: Users },
                      { label: 'Total Content Partners', value: stats.influencers, icon: Activity },
                      { label: 'Task Backlog', value: stats.tasks, icon: FileText },
                    ].map((m, i) => {
                      const Icon = m.icon;
                      return (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-white/3 hover:bg-white/5 rounded-xl transition-all border border-white/3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
                              <Icon size={14} />
                            </div>
                            <span className="text-sm text-zinc-300">{m.label}</span>
                          </div>
                          <span className="text-base font-bold text-white">{loading ? '—' : m.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CAMPAIGNS TAB */}
          {activeTab === 'campaigns' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Campaign Status Breakdown */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5 lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <Megaphone size={18} className="text-rose-400" />
                  <h3 className="font-semibold text-white">Campaign Status Breakdown</h3>
                </div>
                {stats.campaignStatusBreakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.campaignStatusBreakdown} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="status" type="category" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => [`${value} Campaigns`, 'Count']} contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Bar dataKey="count" name="Campaigns" radius={[0, 4, 4, 0]}>
                        {stats.campaignStatusBreakdown.map((entry, index) => {
                          const fill = CAMPAIGN_COLORS[entry.status as keyof typeof CAMPAIGN_COLORS] || 'hsl(var(--primary))';
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-zinc-500 text-sm">
                    No campaigns logged.
                  </div>
                )}
              </div>

              {/* Status Breakdown Legend & Summary */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="font-semibold text-white text-sm">Status Details</h3>
                <div className="space-y-3">
                  {stats.campaignStatusBreakdown?.map((item, idx) => {
                    const color = CAMPAIGN_COLORS[item.status as keyof typeof CAMPAIGN_COLORS] || 'hsl(var(--primary))';
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white/3 border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                          <span className="text-xs text-zinc-300 font-semibold uppercase">{item.status}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{item.count} campaigns</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* INFLUENCERS TAB */}
          {activeTab === 'influencers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scoreboard Card */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-rose-400 animate-pulse" />
                    <h3 className="font-semibold text-white">Top Creator Partners</h3>
                  </div>
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest font-bold">
                    By rating
                  </span>
                </div>

                <div className="space-y-3.5">
                  {stats.topInfluencersByRating?.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic py-12 text-center">No content creators recorded yet.</p>
                  ) : (
                    stats.topInfluencersByRating.map((inf, idx) => (
                      <div key={inf.id} className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center font-bold text-rose-400">
                            #{idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{inf.name}</h4>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{inf.niche || 'Digital Creator'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white">{inf.rating}</span>
                            <span className="text-amber-400 text-xs">★</span>
                          </div>
                          <div className="flex gap-1.5">
                            {inf.instagram && <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">IG</span>}
                            {inf.tiktok && <span className="text-[9px] bg-slate-500/20 text-slate-300 px-1.5 py-0.5 rounded">TT</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ROI Calculator Estimator */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5 space-y-6">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-emerald-400" />
                  <h3 className="font-semibold text-white">Campaign ROI Simulator</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs text-zinc-400">Campaign Budget (₹)</label>
                    <input 
                      type="number" 
                      value={roiBudget}
                      onChange={e => setRoiBudget(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-zinc-400">Reach Ratio (Views/₹)</label>
                    <input 
                      type="number" 
                      value={roiReachMultiplier}
                      onChange={e => setRoiReachMultiplier(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-zinc-400">Conversion Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={roiConvRate}
                      onChange={e => setRoiConvRate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-zinc-400">Avg. Order Value (₹)</label>
                    <input 
                      type="number" 
                      value={roiAov}
                      onChange={e => setRoiAov(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-3.5">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Projected Output</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-zinc-500">Estimated Reach</p>
                      <p className="text-base font-bold text-white mt-0.5">{estimatedReach.toLocaleString()} Views</p>
                    </div>
                    <div className="p-3 bg-white/3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-zinc-500">Projected Orders</p>
                      <p className="text-base font-bold text-white mt-0.5">{estimatedConversions.toLocaleString()} Sales</p>
                    </div>
                    <div className="p-3 bg-white/3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-zinc-500">Simulated Revenue</p>
                      <p className="text-base font-bold text-white mt-0.5">₹{estimatedRevenue.toLocaleString('en-IN')}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${estimatedROI >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <p className="text-[10px] text-zinc-500">Projected ROI %</p>
                      <p className={`text-base font-extrabold mt-0.5 ${estimatedROI >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {estimatedROI.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCE TAB */}
          {activeTab === 'finance' && (
            <>
              {/* Financial KPI bar with Growth rates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl glassmorphism border border-white/5 relative overflow-hidden flex flex-col justify-between h-[130px]">
                  <div>
                    <p className="text-xs text-zinc-400">Total Operational Billing Revenue</p>
                    <p className="text-2xl font-black text-white mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] mt-2">
                    {stats.revenueGrowthRate >= 0 ? (
                      <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-bold">
                        <ArrowUpRight size={10} /> +{stats.revenueGrowthRate.toFixed(1)}% MoM
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full font-bold">
                        <ArrowDownRight size={10} /> {stats.revenueGrowthRate.toFixed(1)}% MoM
                      </span>
                    )}
                    <span className="text-zinc-500">compared to last month</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl glassmorphism border border-white/5 flex flex-col justify-between h-[130px]">
                  <div>
                    <p className="text-xs text-zinc-400">Total Agency Expenses</p>
                    <p className="text-2xl font-black text-white mt-1">₹{stats.totalExpenses.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">Aggregated across all operations & software tools.</p>
                </div>

                <div className="p-5 rounded-2xl glassmorphism border border-white/5 flex flex-col justify-between h-[130px]">
                  <div>
                    <p className="text-xs text-zinc-400">Estimated Project Profit Margin</p>
                    <p className="text-2xl font-black text-white mt-1">
                      ₹{(stats.totalRevenue - stats.totalExpenses).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">
                    Net margin: {stats.totalRevenue > 0 ? (((stats.totalRevenue - stats.totalExpenses) / stats.totalRevenue) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {/* Finance list tables */}
              <div className="glassmorphism rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={18} className="text-primary" />
                  <h3 className="font-semibold text-white">Monthly Transaction Summary</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400 font-semibold uppercase">
                        <th className="pb-3 pr-2">Calendar Month</th>
                        <th className="pb-3 pr-2">Total Monthly Invoice Revenue</th>
                        <th className="pb-3 pr-2">Total Monthly Expenses</th>
                        <th className="pb-3 text-right">Net Monthly Operating Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((m, idx) => {
                        const net = m.revenue - m.expenses;
                        return (
                          <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                            <td className="py-3.5 pr-2 font-semibold text-zinc-300">{m.month}</td>
                            <td className="py-3.5 pr-2 text-zinc-400">₹{m.revenue.toLocaleString('en-IN')}</td>
                            <td className="py-3.5 pr-2 text-zinc-400">₹{m.expenses.toLocaleString('en-IN')}</td>
                            <td className={`py-3.5 text-right font-extrabold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ₹{net.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
