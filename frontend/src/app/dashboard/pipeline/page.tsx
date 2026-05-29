'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, Trophy, XCircle, Phone, Mail, FileText, Loader2, Download } from 'lucide-react';

type Stage = 'LEAD' | 'CONTACTED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST' | 'PAUSED';

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

const stages: { id: Stage; label: string; textClass: string; bgClass: string; borderClass: string }[] = [
  { id: 'LEAD',        label: 'New Lead',     textClass: 'text-slate-600',   bgClass: 'bg-slate-50 border-slate-200',   borderClass: 'border-slate-200' },
  { id: 'CONTACTED',  label: 'Contacted',    textClass: 'text-blue-600',    bgClass: 'bg-blue-50 border-blue-200',    borderClass: 'border-blue-200' },
  { id: 'PROPOSAL',   label: 'Proposal',     textClass: 'text-purple-600',  bgClass: 'bg-purple-50 border-purple-200',  borderClass: 'border-purple-200' },
  { id: 'NEGOTIATION',label: 'Negotiation',  textClass: 'text-amber-600',   bgClass: 'bg-amber-50 border-amber-200',   borderClass: 'border-amber-200' },
  { id: 'WON',        label: 'Won',          textClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-200', borderClass: 'border-emerald-200' },
  { id: 'LOST',       label: 'Lost',         textClass: 'text-red-600',     bgClass: 'bg-red-50 border-red-200',     borderClass: 'border-red-200' },
  { id: 'PAUSED',     label: 'Paused',       textClass: 'text-orange-600',  bgClass: 'bg-orange-50 border-orange-200',  borderClass: 'border-orange-200' },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '', value: '', stage: 'LEAD' as Stage, notes: ''
  });

  const [editForm, setEditForm] = useState({
    companyName: '', contactName: '', email: '', phone: '', value: '', stage: 'LEAD' as Stage, notes: ''
  });

  const getHeaders = () => {
    const token = localStorage.getItem('adrex_token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const fetchLeads = () => {
    fetch(`${API_URL}/api/pipeline`, { headers: getHeaders() })
      .then(r => r.json()).then(setLeads).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/pipeline`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      if (res.ok) { const d = await res.json(); setLeads(p => [d, ...p]); setShowModal(false); setForm({ companyName: '', contactName: '', email: '', phone: '', value: '', stage: 'LEAD', notes: '' }); }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({
      companyName: lead.companyName,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone || '',
      value: String(lead.value),
      stage: lead.stage,
      notes: lead.notes || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/pipeline/${selectedLead.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
        setSelectedLead(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveToStage = async (leadId: string, newStage: Stage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    await fetch(`${API_URL}/api/pipeline/${leadId}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ stage: newStage }) });
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`${API_URL}/api/pipeline/${id}`, { method: 'DELETE', headers: getHeaders() });
    setLeads(p => p.filter(l => l.id !== id));
  };

  const handleExportCSV = () => {
    const headers = ['Company Name', 'Contact Name', 'Email', 'Phone', 'Value', 'Stage', 'Notes', 'Created At'];
    const rows = leads.map(l => [
      `"${l.companyName.replace(/"/g, '""')}"`,
      `"${l.contactName.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      l.value,
      l.stage,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      new Date(l.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adrex-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPipelineValue = leads.filter(l => l.stage !== 'LOST' && l.stage !== 'PAUSED').reduce((s, l) => s + l.value, 0);
  const wonValue = leads.filter(l => l.stage === 'WON').reduce((s, l) => s + l.value, 0);
  const winRate = leads.length > 0 ? Math.round((leads.filter(l => l.stage === 'WON').length / leads.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground mt-1">Track leads from first contact to closed deal.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border hover:bg-muted text-foreground rounded-xl font-semibold transition-all shadow-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:opacity-95 transition-all shadow-sm">
            <Plus size={18} /> Add Lead
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pipeline Value', value: `₹${totalPipelineValue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Closed Won', value: `₹${wonValue.toLocaleString('en-IN')}`, icon: Trophy, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-200' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-border/20 ${kpi.color}`}><kpi.icon size={24} /></div>
            <div><p className="text-sm text-muted-foreground">{kpi.label}</p><p className="text-2xl font-bold text-foreground">{kpi.value}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Kanban Pipeline */}
      <div className="flex gap-5 overflow-x-auto pb-6 snap-x scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {stages.map((stage) => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          const stageValue = stageLeads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={stage.id} className={`shrink-0 w-[300px] snap-center flex flex-col gap-3 rounded-2xl p-3 border ${stage.borderClass} ${dragOverStage === stage.id ? 'bg-muted/80' : 'bg-muted/30'} min-h-[400px] transition-colors`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => { e.preventDefault(); setDragOverStage(null); const id = e.dataTransfer.getData('leadId'); if (id) moveToStage(id, stage.id); }}>
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className={`text-xs font-semibold ${stage.textClass}`}>{stage.label}</p>
                  <p className="text-[10px] text-muted-foreground">₹{stageValue.toLocaleString('en-IN')}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${stage.bgClass}`}>{stageLeads.length}</span>
              </div>

              {/* Cards */}
              <AnimatePresence>
                {stageLeads.map((lead) => (
                  <motion.div key={lead.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    draggable onDragStart={(e: any) => e.dataTransfer.setData('leadId', lead.id)}
                    onClick={() => openEditModal(lead)}
                    className="bg-card border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 group relative shadow-sm hover:shadow-md transition-all">
                    <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-600 transition-all">
                      <X size={12} />
                    </button>
                    <p className="text-sm font-semibold text-foreground pr-6 truncate">{lead.companyName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.contactName}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <DollarSign size={10} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-600">₹{lead.value.toLocaleString('en-IN')}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1 mt-1.5 text-muted-foreground/80">
                        <Mail size={10} /><span className="text-[10px] truncate">{lead.email}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {stageLeads.length === 0 && !loading && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[11px] text-muted-foreground/60 text-center">Drop leads here</p>
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
            <motion.div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Add New Lead</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Company Name*</label><input required value={form.companyName} onChange={e => setForm(p => ({...p, companyName: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Contact Name*</label><input required value={form.contactName} onChange={e => setForm(p => ({...p, contactName: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Email*</label><input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Deal Value (₹)</label><input type="number" value={form.value} onChange={e => setForm(p => ({...p, value: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Stage</label>
                    <select value={form.stage} onChange={e => setForm(p => ({...p, stage: e.target.value as Stage}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                      {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block text-xs text-muted-foreground mb-1.5">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none" /></div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-95 shadow-sm disabled:opacity-70 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Adding Lead...
                      </>
                    ) : (
                      'Add Lead'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Lead Modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
            <motion.div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Edit Lead Details</h2>
                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><X size={18} /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Company Name*</label><input required value={editForm.companyName} onChange={e => setEditForm(p => ({...p, companyName: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Contact Name*</label><input required value={editForm.contactName} onChange={e => setEditForm(p => ({...p, contactName: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Email*</label><input type="email" required value={editForm.email} onChange={e => setEditForm(p => ({...p, email: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Phone</label><input value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Deal Value (₹)</label><input type="number" value={editForm.value} onChange={e => setEditForm(p => ({...p, value: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Stage</label>
                    <select value={editForm.stage} onChange={e => setEditForm(p => ({...p, stage: e.target.value as Stage}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                      {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="block text-xs text-muted-foreground mb-1.5">Notes</label><textarea rows={2} value={editForm.notes} onChange={e => setEditForm(p => ({...p, notes: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none" /></div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={() => { deleteLead(selectedLead.id); setSelectedLead(null); }} className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-sm font-semibold rounded-xl border border-red-500/20 mr-auto transition-all">Delete Lead</button>
                  <button type="button" disabled={isSubmitting} onClick={() => setSelectedLead(null)} className="px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-95 shadow-sm disabled:opacity-70 flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
