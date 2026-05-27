'use client';

import { use, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Share2, FileText, Megaphone, Users, Award, 
  DollarSign, CheckSquare, ShieldCheck, Mail, Phone, Loader2, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClientPortalCard from '@/components/ClientPortalCard';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CampaignSummary {
  id: string;
  name: string;
  description: string | null;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  tasksSummary: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
  issuedDate: string;
}

interface Influencer {
  id: string;
  name: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  niche: string | null;
}

interface ClientPortalData {
  client: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string | null;
    status: string;
    monthlyBudget: number | null;
  };
  campaigns: CampaignSummary[];
  invoices: Invoice[];
  influencers: Influencer[];
}

const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981']; // todo, in progress, review, done

export default function ClientPortalPreviewPage({ params }: { params: Promise<{ clientId: string }> }) {
  const router = useRouter();
  const { clientId } = use(params);
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const token = localStorage.getItem('adrex_token');
        const res = await fetch(`${API_URL}/api/client-portal/${clientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch portal data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Portal Data Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">Could not load client workspace details.</p>
        <button 
          onClick={() => router.push('/dashboard/client-portal')} 
          className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
        >
          Back to Selection
        </button>
      </div>
    );
  }

  const { client, campaigns, invoices, influencers } = data;

  // Aggregate tasks stats across all campaigns for visual donut chart
  const totalTasks = campaigns.reduce((acc, c) => acc + c.tasksSummary.total, 0);
  const todoTasks = campaigns.reduce((acc, c) => acc + c.tasksSummary.todo, 0);
  const inProgressTasks = campaigns.reduce((acc, c) => acc + c.tasksSummary.inProgress, 0);
  const reviewTasks = campaigns.reduce((acc, c) => acc + c.tasksSummary.review, 0);
  const doneTasks = campaigns.reduce((acc, c) => acc + c.tasksSummary.done, 0);

  const taskChartData = [
    { name: 'To Do', value: todoTasks },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'Review', value: reviewTasks },
    { name: 'Done', value: doneTasks }
  ].filter(item => item.value > 0);

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/dashboard/client-portal/${client.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/dashboard/client-portal')}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Portals
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleShareLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all"
          >
            <Share2 size={16} className="text-purple-400" />
            {copied ? 'Link Copied!' : 'Copy Portal Link'}
          </button>
          
          <button 
            onClick={() => {
              const token = localStorage.getItem('adrex_token');
              window.open(`${API_URL}/api/pdf/report?token=${token}`, '_blank');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <FileText size={16} />
            Export Campaign PDF
          </button>
        </div>
      </div>

      {/* Brand Header Display */}
      <div className="glassmorphism rounded-3xl p-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{client.companyName}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-500/20">
              {client.status} Workspace
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-2 flex items-center gap-1">
            <Users size={14} className="text-zinc-500" /> Primary Contact: <span className="text-white font-medium">{client.contactName}</span>
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Mail size={12} /> {client.email}</span>
            {client.phone && <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>}
          </div>
        </div>

        {client.monthlyBudget && (
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-right w-full md:w-auto">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Monthly Marketing Budget</p>
            <p className="text-2xl font-black text-white mt-1">₹{client.monthlyBudget.toLocaleString('en-IN')}</p>
          </div>
        )}
      </div>

      {/* Grid: Campaigns List & Task Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Megaphone size={16} className="text-purple-400" /> Linked Campaigns ({campaigns.length})
          </h2>
          {campaigns.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-zinc-500 text-sm">
              No campaigns currently active for this workspace.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map(c => (
                <ClientPortalCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>

        {/* Global Progress Donut */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <CheckSquare size={16} className="text-emerald-400" /> Deliverables Overview
          </h2>
          <div className="glassmorphism border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
            {totalTasks > 0 ? (
              <>
                <div className="w-full h-[180px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie 
                        data={taskChartData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={50} 
                        outerRadius={75} 
                        paddingAngle={3} 
                        dataKey="value"
                      >
                        {taskChartData.map((entry, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Tasks`, 'Count']} contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{doneTasks}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Completed</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400"><div className="w-2.5 h-2.5 rounded bg-slate-400" /> Todo: {todoTasks}</div>
                  <div className="flex items-center gap-1.5 text-zinc-400"><div className="w-2.5 h-2.5 rounded bg-blue-500" /> Progress: {inProgressTasks}</div>
                  <div className="flex items-center gap-1.5 text-zinc-400"><div className="w-2.5 h-2.5 rounded bg-amber-500" /> Review: {reviewTasks}</div>
                  <div className="flex items-center gap-1.5 text-zinc-400"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Done: {doneTasks}</div>
                </div>
              </>
            ) : (
              <div className="text-zinc-500 text-sm text-center py-12">
                No active tasks linked to campaigns.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Influencers & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Influencers */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Award size={16} className="text-purple-400" /> Assigned Brand Partners ({influencers.length})
          </h2>
          <div className="glassmorphism border border-white/10 rounded-2xl p-6 space-y-4">
            {influencers.length === 0 ? (
              <p className="text-sm text-zinc-500 italic py-4">No content partners assigned yet.</p>
            ) : (
              influencers.map(inf => (
                <div key={inf.id} className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-all">
                  <div>
                    <h4 className="font-bold text-white text-sm">{inf.name}</h4>
                    {inf.niche && <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5 block">{inf.niche}</span>}
                  </div>
                  <div className="flex gap-2 text-xs">
                    {inf.instagram && <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">Instagram</span>}
                    {inf.youtube && <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">YouTube</span>}
                    {inf.tiktok && <span className="bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded border border-slate-500/20">TikTok</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <DollarSign size={16} className="text-amber-400" /> Invoices & Billings
          </h2>
          <div className="glassmorphism border border-white/10 rounded-2xl p-6 overflow-hidden">
            {invoices.length === 0 ? (
              <p className="text-sm text-zinc-500 italic py-4">No invoice transactions history.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 font-semibold uppercase">
                      <th className="pb-3 pr-2">Invoice #</th>
                      <th className="pb-3 pr-2">Due Date</th>
                      <th className="pb-3 pr-2">Status</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => {
                      const badgeColor = inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400';
                      return (
                        <tr key={inv.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                          <td className="py-3.5 pr-2 font-mono text-zinc-300">INV-{inv.id.slice(0, 8).toUpperCase()}</td>
                          <td className="py-3.5 pr-2 text-zinc-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                          <td className="py-3.5 pr-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-bold text-white">₹{inv.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Checkpoint */}
      <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs py-4 border-t border-white/5">
        <ShieldCheck size={14} className="text-blue-500/60" />
        <span>Secure client dashboard mode activated. Data shown is read-only.</span>
      </div>
    </div>
  );
}
