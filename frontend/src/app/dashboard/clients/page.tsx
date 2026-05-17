'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreHorizontal, Briefcase, Mail, Phone, DollarSign, X, Building2 } from 'lucide-react';

interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  monthlyBudget: number | null;
  status: string;
  campaigns?: any[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ companyName: '', contactName: '', email: '', phone: '', monthlyBudget: '' });

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.companyName) return;

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newClient, status: 'ACTIVE' })
      });
      
      if (res.ok) {
        const created = await res.json();
        setClients(prev => [created, ...prev]);
        setNewClient({ companyName: '', contactName: '', email: '', phone: '', monthlyBudget: '' });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to create client', error);
    }
  };

  const filtered = clients.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your agency's client relationships.</p>
        </div>
        <button
          id="new-client-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: `${loading ? '-' : clients.length}`, icon: Building2 },
          { label: 'Active Clients', value: `${loading ? '-' : clients.filter(c => c.status === 'ACTIVE').length}`, icon: Briefcase },
          { label: 'Total MRR', value: `₹${clients.reduce((acc, c) => acc + (c.monthlyBudget || 0), 0).toLocaleString('en-IN')}`, icon: DollarSign },
          { label: 'Avg. Budget', value: `₹${clients.length ? Math.round(clients.reduce((acc, c) => acc + (c.monthlyBudget || 0), 0) / clients.length).toLocaleString('en-IN') : 0}`, icon: DollarSign },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="p-4 rounded-xl glassmorphism flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {loading ? (
             <div className="col-span-full py-8 text-center text-muted-foreground animate-pulse">Loading clients...</div>
          ) : filtered.length === 0 ? (
             <div className="col-span-full py-8 text-center text-muted-foreground">No clients found. Add one above.</div>
          ) : filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.06 }}
              className="glassmorphism rounded-2xl p-6 group hover:border-primary/30 border border-transparent transition-all"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-blue-500/30 flex items-center justify-center font-bold text-lg">
                    {c.companyName[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.companyName}</h3>
                    <p className="text-xs text-muted-foreground">{c.campaigns?.length || 0} campaigns</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-400/10'
                }`}>
                  {c.status}
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={14} className="shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign size={14} className="shrink-0" />
                  <span>₹{(c.monthlyBudget || 0).toLocaleString('en-IN')} / month</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.contactName}</span>
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-all opacity-0 group-hover:opacity-100">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-lg glassmorphism rounded-2xl p-8"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add Client</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Company Name</label>
                  <input value={newClient.companyName} onChange={e => setNewClient(p => ({ ...p, companyName: e.target.value }))} type="text" placeholder="Acme Corp" required className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Contact Name</label>
                    <input value={newClient.contactName} onChange={e => setNewClient(p => ({ ...p, contactName: e.target.value }))} type="text" placeholder="John Doe" required className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone</label>
                    <input value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} type="tel" placeholder="+1 555-0000" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Work Email</label>
                  <input value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} type="email" placeholder="contact@company.com" required className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Monthly Budget ($)</label>
                  <input value={newClient.monthlyBudget} onChange={e => setNewClient(p => ({ ...p, monthlyBudget: e.target.value }))} type="number" placeholder="50000" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  Add Client
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
