'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, Trophy, XCircle, Phone, Mail, FileText } from 'lucide-react';

type Stage = 'LEAD' | 'CONTACTED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  value: number;
  stage: Stage;
  notes?: string;
  createdAt: string;
}

const stages: { id: Stage; label: string; color: string; bg: string; border: string }[] = [
  { id: 'LEAD',        label: 'New Lead',     color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30' },
  { id: 'CONTACTED',  label: 'Contacted',    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  { id: 'PROPOSAL',   label: 'Proposal',     color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  { id: 'NEGOTIATION',label: 'Negotiation',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
  { id: 'WON',        label: 'Won',          color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'LOST',       label: 'Lost',         color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '', value: '', stage: 'LEAD' as Stage, notes: ''
  });

  const getHeaders = () => {
    const token = localStorage.getItem('adrex_token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/pipeline', { headers: getHeaders() })
      .then(r => r.json()).then(setLeads).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/pipeline', { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
    if (res.ok) { const d = await res.json(); setLeads(p => [d, ...p]); setShowModal(false); setForm({ companyName: '', contactName: '', email: '', phone: '', value: '', stage: 'LEAD', notes: '' }); }
  };

  const moveToStage = async (leadId: string, newStage: Stage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    await fetch(`http://localhost:5000/api/pipeline/${leadId}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ stage: newStage }) });
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`http://localhost:5000/api/pipeline/${id}`, { method: 'DELETE', headers: getHeaders() });
    setLeads(p => p.filter(l => l.id !== id));
  };

  const totalPipelineValue = leads.filter(l => l.stage !== 'LOST').reduce((s, l) => s + l.value, 0);
  const wonValue = leads.filter(l => l.stage === 'WON').reduce((s, l) => s + l.value, 0);
  const winRate = leads.length > 0 ? Math.round((leads.filter(l => l.stage === 'WON').length / leads.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground mt-1">Track leads from first contact to closed deal.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Plus size={18} /> Add Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pipeline Value', value: `$${totalPipelineValue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-400' },
          { label: 'Closed Won', value: `$${wonValue.toLocaleString()}`, icon: Trophy, color: 'text-emerald-400' },
          { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-purple-400' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl glassmorphism flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${kpi.color}`}><kpi.icon size={24} /></div>
            <div><p className="text-sm text-zinc-400">{kpi.label}</p><p className="text-2xl font-bold text-white">{kpi.value}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Kanban Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          const stageValue = stageLeads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={stage.id} className={`flex flex-col gap-3 rounded-2xl p-3 border ${stage.border} ${dragOverStage === stage.id ? 'bg-white/5' : 'bg-white/[0.02]'} min-h-[300px] transition-colors`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => { e.preventDefault(); setDragOverStage(null); const id = e.dataTransfer.getData('leadId'); if (id) moveToStage(id, stage.id); }}>
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className={`text-xs font-semibold ${stage.color}`}>{stage.label}</p>
                  <p className="text-[10px] text-zinc-500">${stageValue.toLocaleString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${stage.bg} ${stage.color} font-bold`}>{stageLeads.length}</span>
              </div>

              {/* Cards */}
              <AnimatePresence>
                {stageLeads.map((lead) => (
                  <motion.div key={lead.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    draggable onDragStart={(e: any) => e.dataTransfer.setData('leadId', lead.id)}
                    className="bg-zinc-900 border border-white/10 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-white/20 group relative">
                    <button onClick={() => deleteLead(lead.id)} className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all">
                      <X size={12} />
                    </button>
                    <p className="text-sm font-semibold text-white pr-6 truncate">{lead.companyName}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{lead.contactName}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <DollarSign size={10} className="text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">${lead.value.toLocaleString()}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1 mt-1.5 text-zinc-500">
                        <Mail size={10} /><span className="text-[10px] truncate">{lead.email}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {stageLeads.length === 0 && !loading && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[11px] text-zinc-600 text-center">Drop leads here</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add New Lead</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Company Name*</label><input required value={form.companyName} onChange={e => setForm(p => ({...p, companyName: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Contact Name*</label><input required value={form.contactName} onChange={e => setForm(p => ({...p, contactName: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Email*</label><input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Deal Value ($)</label><input type="number" value={form.value} onChange={e => setForm(p => ({...p, value: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Stage</label>
                    <select value={form.stage} onChange={e => setForm(p => ({...p, stage: e.target.value as Stage}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
                      {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block text-xs text-zinc-400 mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none" /></div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 shadow-[0_0_15px_rgba(168,85,247,0.3)]">Add Lead</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
