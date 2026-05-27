'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreHorizontal, Briefcase, Mail, Phone, DollarSign, X, Building2, Pencil, Trash2, Loader2 } from 'lucide-react';

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
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ companyName: '', contactName: '', email: '', phone: '', monthlyBudget: '' });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.companyName || isSubmitting) return;

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newClient, status: editingClient.status })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingClient(null);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to update client', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== id));
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Failed to delete client', error);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      companyName: client.companyName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone || '',
      monthlyBudget: client.monthlyBudget ? String(client.monthlyBudget) : '',
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const filtered = clients.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your agency's client relationships.</p>
        </div>
        <button
          id="new-client-btn"
          onClick={() => { setEditingClient(null); setNewClient({ companyName: '', contactName: '', email: '', phone: '', monthlyBudget: '' }); setShowModal(true); }}
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
            <div key={i} className="p-4 rounded-xl glassmorphism flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </div>
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
        {loading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground animate-pulse">Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">No clients found. Add one above.</div>
        ) : filtered.map((c) => (
          <div
            key={c.id}
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
              <div className="relative">
                <button onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-all">
                  <MoreHorizontal size={16} />
                </button>
                {openMenuId === c.id && (
                  <div ref={menuRef} className="absolute right-0 bottom-full mb-1 w-36 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-10">
                    <button onClick={() => openEditModal(c)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-t-xl transition-all">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-b-xl transition-all">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); setEditingClient(null); }} />
          <div className="relative z-10 w-full max-w-lg glassmorphism rounded-2xl p-8 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingClient ? 'Edit Client' : 'Add Client'}</h2>
              <button onClick={() => { setShowModal(false); setEditingClient(null); }} className="p-2 hover:bg-white/5 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={editingClient ? handleUpdate : handleCreate}>
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
              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-70 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {editingClient ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingClient ? 'Update Client' : 'Add Client'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
