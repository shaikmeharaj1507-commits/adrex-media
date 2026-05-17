'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Target, MoreHorizontal, Megaphone, X, Sparkles, Loader2
} from 'lucide-react';

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE:    { color: 'text-emerald-400', bg: 'bg-emerald-400/10',  label: 'Active' },
  DRAFT:     { color: 'text-slate-400',   bg: 'bg-slate-400/10',    label: 'Draft' },
  PLANNED:   { color: 'text-blue-400',    bg: 'bg-blue-400/10',     label: 'Planned' },
  COMPLETED: { color: 'text-purple-400',  bg: 'bg-purple-400/10',   label: 'Completed' },
  PAUSED:    { color: 'text-amber-400',   bg: 'bg-amber-400/10',    label: 'Paused' },
};

interface Campaign {
  id: string;
  name: string;
  client: { companyName: string };
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: '', clientId: '', budget: '', status: 'DRAFT', startDate: '', endDate: '', description: '' });
  
  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [campRes, cliRes] = await Promise.all([
        fetch(`${API_URL}/api/campaigns`, { headers }),
        fetch(`${API_URL}/api/clients`, { headers })
      ]);
      if (campRes.ok) setCampaigns(await campRes.json());
      if (cliRes.ok) setClients(await cliRes.json());
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.name || !newCamp.clientId || !newCamp.startDate || !newCamp.endDate) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newCamp)
      });
      if (res.ok) {
        const created = await res.json();
        setCampaigns(prev => [created, ...prev]);
        setNewCamp({ name: '', clientId: '', budget: '', status: 'DRAFT', startDate: '', endDate: '', description: '' });
        setAiSuggested(false);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to create campaign', error);
    }
  };

  const handleAIGenerate = async () => {
    const selectedClient = clients.find(c => c.id === newCamp.clientId);
    if (!selectedClient) {
      alert('Please select a client first so the AI can tailor the campaign idea.');
      return;
    }
    setAiLoading(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/ai/campaign-idea`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          clientName: selectedClient.companyName,
          industry: selectedClient.niche || 'Marketing',
          budget: newCamp.budget,
          goals: 'Brand awareness and conversions'
        })
      });
      if (res.ok) {
        const idea = await res.json();
        setNewCamp(prev => ({
          ...prev,
          name: idea.name || prev.name,
          description: idea.description || '',
        }));
        setAiSuggested(true);
      }
    } catch (error) {
      console.error('AI generation failed', error);
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.client?.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your marketing campaigns.</p>
        </div>
        <button id="new-campaign-btn" onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Plus size={18} /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: loading ? '-' : campaigns.length, sub: 'All time' },
          { label: 'Active Now', value: loading ? '-' : campaigns.filter(c => c.status === 'ACTIVE').length, sub: 'Running' },
          { label: 'Total Budget', value: loading ? '-' : `₹${campaigns.reduce((a,c) => a + c.budget, 0).toLocaleString('en-IN')}`, sub: 'Allocated' },
          { label: 'Completed', value: loading ? '-' : campaigns.filter(c => c.status === 'COMPLETED').length, sub: 'Finished' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="p-4 rounded-xl glassmorphism">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input id="campaign-search" type="text" placeholder="Search campaigns or clients..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'ACTIVE', 'DRAFT', 'PLANNED', 'COMPLETED', 'PAUSED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
              {s === 'ALL' ? 'All' : statusConfig[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div className="glassmorphism rounded-2xl overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Campaign</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Client</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Budget</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Timeline</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading campaigns...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <Target size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No campaigns found. Create one above!</p>
                  </td></tr>
                ) : filtered.map((c, i) => {
                  const st = statusConfig[c.status] || statusConfig.DRAFT;
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-border/30 hover:bg-white/3 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary"><Megaphone size={16} /></div>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{c.client?.companyName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.color} ${st.bg}`}>{st.label}</span>
                      </td>
                      <td className="px-6 py-4 font-medium">₹{c.budget.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); setAiSuggested(false); }} />
            <motion.div className="relative z-10 w-full max-w-lg bg-zinc-900/95 border border-white/15 rounded-2xl p-8 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">New Campaign</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">Fill in the details or use AI to spark ideas.</p>
                </div>
                <button onClick={() => { setShowModal(false); setAiSuggested(false); }} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>

              <form className="space-y-4" onSubmit={handleCreate}>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">Client</label>
                  <select value={newCamp.clientId} onChange={e => setNewCamp(p => ({ ...p, clientId: e.target.value }))} required
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                    <option value="" disabled>Select a client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-zinc-300">Campaign Name</label>
                    <button type="button" onClick={handleAIGenerate} disabled={aiLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/25 hover:bg-purple-500/25 transition-all disabled:opacity-50">
                      {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      {aiLoading ? 'Generating...' : '✦ Spark with AI'}
                    </button>
                  </div>
                  <input value={newCamp.name} onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))} type="text" placeholder="e.g. Summer Glow 2025" required
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>

                {aiSuggested && newCamp.description && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xs font-medium text-purple-300 mb-1">✦ AI Brief</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{newCamp.description}</p>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">Budget ($)</label>
                    <input value={newCamp.budget} onChange={e => setNewCamp(p => ({ ...p, budget: e.target.value }))} type="number" placeholder="50000" required
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">Status</label>
                    <select value={newCamp.status} onChange={e => setNewCamp(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PLANNED">PLANNED</option>
                      <option value="ACTIVE">ACTIVE</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">Start Date</label>
                    <input value={newCamp.startDate} onChange={e => setNewCamp(p => ({ ...p, startDate: e.target.value }))} type="date" required
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-300">End Date</label>
                    <input value={newCamp.endDate} onChange={e => setNewCamp(p => ({ ...p, endDate: e.target.value }))} type="date" required
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all mt-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  Create Campaign
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
