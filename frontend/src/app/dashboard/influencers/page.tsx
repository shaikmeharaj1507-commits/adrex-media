'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Mail, MessageCircle, MoreVertical, X, Sparkles, Loader2, MessageSquare, Send, Star, Pencil, Trash2, CheckCircle, XCircle, Download } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface Influencer {
  id: string;
  name: string;
  email: string | null;
  niche: string | null;
  platform: string; 
  followers: string;
  rating: number;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  whatsapp: string | null;
  location: string | null;
  status: string;
  pricing: string | null;
  audienceStats: string | null;
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState<string | null>(null);
  const [waMessage, setWaMessage] = useState('');
  const [waHistory, setWaHistory] = useState<any[]>([]);
  const [sendingWa, setSendingWa] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInf, setNewInf] = useState({ 
    name: '', niche: '', platform: 'Instagram', followers: '100K', rating: 5, 
    instagram: '', tiktok: '', youtube: '', email: '', whatsapp: '', 
    location: '', status: 'APPROVED', pricing: '', audienceStats: '' 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredInfluencers = influencers.filter(inf => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      inf.name.toLowerCase().includes(q) ||
      (inf.niche || '').toLowerCase().includes(q) ||
      (inf.location || '').toLowerCase().includes(q) ||
      (inf.email || '').toLowerCase().includes(q) ||
      (inf.instagram || '').toLowerCase().includes(q) ||
      (inf.youtube || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || inf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fetchInfluencers = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInfluencers(data);
      }
    } catch (error) {
      console.error('Failed to fetch influencers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchWaHistory = async (phone: string) => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/whatsapp/history?phoneNumber=${encodeURIComponent(phone)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWaHistory(await res.json());
    } catch (error) { console.error('Failed to fetch WA history'); }
  };

  const openWhatsApp = (inf: Influencer) => {
    setShowWhatsApp(inf.id);
    // In a real app we'd use inf.whatsapp or inf.phone. For demo, placeholder:
    fetchWaHistory(inf.whatsapp || '+1234567890');
  };

  const sendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waMessage.trim() || !showWhatsApp) return;
    setSendingWa(true);
    try {
      const inf = influencers.find(i => i.id === showWhatsApp);
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ to: inf?.whatsapp || '+1234567890', body: waMessage }) 
      });
      if (res.ok) {
        setWaMessage('');
        fetchWaHistory(inf?.whatsapp || '+1234567890');
      }
    } catch (error) { console.error('Failed to send WA', error); } 
    finally { setSendingWa(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInf.name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const payload = {
        name: newInf.name,
        email: newInf.email,
        whatsapp: newInf.whatsapp,
        location: newInf.location,
        niche: newInf.niche,
        instagram: newInf.platform === 'Instagram' ? newInf.followers : newInf.instagram,
        tiktok: newInf.platform === 'TikTok' ? newInf.followers : newInf.tiktok,
        youtube: newInf.platform === 'YouTube' ? newInf.followers : newInf.youtube,
        rating: newInf.rating,
        status: newInf.status,
        pricing: newInf.pricing,
        audienceStats: newInf.audienceStats
      };

      const res = await fetch(`${API_URL}/api/influencers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const created = await res.json();
        setInfluencers(prev => [created, ...prev]);
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to create influencer', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInfluencer || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const payload = {
        name: newInf.name,
        email: newInf.email,
        whatsapp: newInf.whatsapp,
        location: newInf.location,
        niche: newInf.niche,
        instagram: newInf.platform === 'Instagram' ? newInf.followers : newInf.instagram,
        tiktok: newInf.platform === 'TikTok' ? newInf.followers : newInf.tiktok,
        youtube: newInf.platform === 'YouTube' ? newInf.followers : newInf.youtube,
        rating: newInf.rating,
        status: newInf.status,
        pricing: newInf.pricing,
        audienceStats: newInf.audienceStats
      };

      const res = await fetch(`${API_URL}/api/influencers/${editingInfluencer.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const updated = await res.json();
        setInfluencers(prev => prev.map(i => i.id === updated.id ? updated : i));
        setEditingInfluencer(null);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to update influencer', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencers/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setInfluencers(prev => prev.map(i => i.id === id ? updated : i));
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this influencer?')) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setInfluencers(prev => prev.filter(i => i.id !== id));
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Failed to delete influencer', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'WhatsApp', 'Instagram', 'TikTok', 'YouTube', 'Niche', 'Rating', 'Location', 'Status', 'Pricing'];
    const rows = influencers.map(i => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${(i.email || '').replace(/"/g, '""')}"`,
      `"${(i.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(i.instagram || '').replace(/"/g, '""')}"`,
      `"${(i.tiktok || '').replace(/"/g, '""')}"`,
      `"${(i.youtube || '').replace(/"/g, '""')}"`,
      `"${(i.niche || '').replace(/"/g, '""')}"`,
      i.rating,
      `"${(i.location || '').replace(/"/g, '""')}"`,
      i.status,
      `"${(i.pricing || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adrex-influencers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setNewInf({ name: '', niche: '', platform: 'Instagram', followers: '100K', rating: 5, instagram: '', tiktok: '', youtube: '', email: '', whatsapp: '', location: '', status: 'APPROVED', pricing: '', audienceStats: '' });
  };

  const openEditModal = (inf: Influencer) => {
    const plat = getPlatform(inf);
    setEditingInfluencer(inf);
    setNewInf({
      name: inf.name,
      email: inf.email || '',
      whatsapp: inf.whatsapp || '',
      location: inf.location || '',
      status: inf.status || 'APPROVED',
      pricing: inf.pricing || '',
      audienceStats: inf.audienceStats || '',
      niche: inf.niche || '',
      platform: plat.name === 'Other' ? 'Instagram' : plat.name,
      followers: plat.followers,
      rating: inf.rating || 5,
      instagram: inf.instagram || '',
      tiktok: inf.tiktok || '',
      youtube: inf.youtube || ''
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const getPlatform = (inf: Influencer) => {
    if (inf.youtube) return { name: 'YouTube', followers: inf.youtube };
    if (inf.tiktok) return { name: 'TikTok', followers: inf.tiktok };
    if (inf.instagram) return { name: 'Instagram', followers: inf.instagram };
    return { name: 'Other', followers: 'N/A' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Influencer CRM</h1>
          <p className="text-muted-foreground mt-1">Manage your roster of content creators and review applications.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-all">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => { resetForm(); setEditingInfluencer(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Plus size={18} />
            <span>Add Influencer</span>
          </button>
        </div>
      </div>

      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              type="text"
              id="influencer-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, niche, location, email..." 
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="relative">
            <button 
              id="influencer-status-filter-btn"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
              <Filter size={18} />
              <span>{statusFilter === 'ALL' ? 'All Status' : statusFilter}</span>
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/5 ${statusFilter === s ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-300'}`}>
                    {s === 'ALL' ? 'All Status' : s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Niche</th>
                <th className="pb-3 font-medium">Platform</th>
                <th className="pb-3 font-medium">Contact</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground animate-pulse">Loading influencers...</td></tr>
              ) : filteredInfluencers.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{influencers.length > 0 ? 'No influencers match your search.' : 'No influencers found.'}</td></tr>
              ) : filteredInfluencers.map((inf) => {
                const plat = getPlatform(inf);
                return (
                  <tr key={inf.id} className="border-b border-border/10 hover:bg-white/5 transition-colors group">
                    <td className="py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-primary font-bold text-xs">
                        {inf.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p>{inf.name}</p>
                        <p className="text-xs text-muted-foreground font-normal">{inf.location || 'No location'}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(inf.status)}`}>
                        {inf.status || 'APPROVED'}
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">{inf.niche || 'N/A'}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                          {plat.name}
                        </span>
                        <span className="text-sm font-medium">{plat.followers}</span>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground text-sm">
                      <div className="flex flex-col gap-1">
                        {inf.email && <span className="flex items-center gap-1"><Mail size={12}/> {inf.email}</span>}
                        {inf.whatsapp && <span className="flex items-center gap-1 text-green-400"><MessageCircle size={12}/> {inf.whatsapp}</span>}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button 
                          onClick={() => openWhatsApp(inf)}
                          className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Send WhatsApp"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button onClick={() => setOpenMenuId(openMenuId === inf.id ? null : inf.id)} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors"><MoreVertical size={16} /></button>
                        {openMenuId === inf.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden text-left">
                            {inf.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleStatusChange(inf.id, 'APPROVED')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-all">
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button onClick={() => handleStatusChange(inf.id, 'REJECTED')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all border-b border-white/10">
                                  <XCircle size={14} /> Reject
                                </button>
                              </>
                            )}
                            <button onClick={() => openEditModal(inf)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-all mt-1">
                              <Pencil size={14} /> Edit Details
                            </button>
                            <button onClick={() => handleDelete(inf.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-2xl glassmorphism rounded-2xl p-8 max-h-[90vh] overflow-y-auto my-8"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-zinc-900/90 backdrop-blur-md pt-2 pb-4 -mt-4 border-b border-white/10 z-20">
                <h2 className="text-2xl font-bold">{editingInfluencer ? 'Edit Influencer' : 'Add Influencer'}</h2>
                <button onClick={() => { setShowModal(false); setEditingInfluencer(null); }} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <form className="space-y-6" onSubmit={editingInfluencer ? handleUpdate : handleCreate}>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-400 border-b border-white/10 pb-2">Basic Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Name *</label>
                      <input value={newInf.name} onChange={e => setNewInf(p => ({ ...p, name: e.target.value }))}
                        type="text" placeholder="e.g. Sarah Chen" required
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Status</label>
                      <select value={newInf.status} onChange={e => setNewInf(p => ({ ...p, status: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-400 border-b border-white/10 pb-2">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Email</label>
                      <input value={newInf.email} onChange={e => setNewInf(p => ({ ...p, email: e.target.value }))}
                        type="email" placeholder="email@example.com"
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">WhatsApp</label>
                      <input value={newInf.whatsapp} onChange={e => setNewInf(p => ({ ...p, whatsapp: e.target.value }))}
                        type="text" placeholder="+1234567890"
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1.5">Location</label>
                      <input value={newInf.location} onChange={e => setNewInf(p => ({ ...p, location: e.target.value }))}
                        type="text" placeholder="City, Country"
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-pink-400 border-b border-white/10 pb-2">Platform & Audience</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Primary Platform</label>
                      <select value={newInf.platform} onChange={e => setNewInf(p => ({ ...p, platform: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="YouTube">YouTube</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Followers</label>
                      <input value={newInf.followers} onChange={e => setNewInf(p => ({ ...p, followers: e.target.value }))}
                        type="text" placeholder="e.g. 150K" 
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Niche</label>
                      <input value={newInf.niche} onChange={e => setNewInf(p => ({ ...p, niche: e.target.value }))}
                        type="text" placeholder="e.g. Tech, Beauty" 
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Rating (1-5)</label>
                      <input value={newInf.rating} onChange={e => setNewInf(p => ({ ...p, rating: parseInt(e.target.value) || 0 }))}
                        type="number" min={1} max={5}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Pricing / Rates</label>
                      <input value={newInf.pricing} onChange={e => setNewInf(p => ({ ...p, pricing: e.target.value }))}
                        type="text" placeholder="$500 per Reel"
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Audience Demographics</label>
                    <textarea value={newInf.audienceStats} onChange={e => setNewInf(p => ({ ...p, audienceStats: e.target.value }))}
                      rows={2} placeholder="60% Female, Top countries: US, UK"
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
                  </div>
                </div>

                {editingInfluencer && (
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <h3 className="text-lg font-semibold text-emerald-400 border-b border-white/10 pb-2">Portal Access Credentials</h3>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                      <p className="text-xs text-zinc-400">
                        Generate or update portal credentials for this creator. They will log in using their email <strong>{newInf.email || editingInfluencer.email}</strong>.
                      </p>
                      
                      <div className="flex gap-3">
                        <input 
                          type="password" 
                          placeholder="Enter portal password (min 6 chars)" 
                          id="portal-pwd-input"
                          className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button 
                          type="button"
                          onClick={async () => {
                            const pwdInput = document.getElementById('portal-pwd-input') as HTMLInputElement;
                            const password = pwdInput?.value;
                            if (!password || password.length < 6) {
                              alert('Please enter a password with at least 6 characters.');
                              return;
                            }
                            try {
                              const token = localStorage.getItem('adrex_token');
                              const res = await fetch(`${API_URL}/api/influencers/${editingInfluencer.id}/portal-user`, {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ password })
                              });
                              if (res.ok) {
                                alert('Portal credentials set successfully!');
                                pwdInput.value = '';
                              } else {
                                const err = await res.json();
                                alert(err.error || 'Failed to set credentials.');
                              }
                            } catch (e) {
                              console.error(e);
                              alert('Error generating portal user.');
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                        >
                          Generate/Update Portal Login
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 mt-4 border-t border-white/10 sticky bottom-0 bg-zinc-900/90 backdrop-blur-md pb-4 z-20">
                  <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-70 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        {editingInfluencer ? 'Saving Changes...' : 'Adding Influencer...'}
                      </>
                    ) : (
                      editingInfluencer ? 'Save Changes' : 'Add Influencer'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Modal */}
      <AnimatePresence>
        {showWhatsApp && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWhatsApp(null)} />
            <motion.div className="relative z-10 w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[600px]" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-green-500/10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageSquare size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{influencers.find(i => i.id === showWhatsApp)?.name}</h2>
                    <p className="text-xs text-green-400 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> WhatsApp Connected</p>
                  </div>
                </div>
                <button onClick={() => setShowWhatsApp(null)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"><X size={20} /></button>
              </div>

              {/* Chat History */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-950/50">
                {waHistory.length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm mt-10">No messages yet. Start the conversation!</div>
                ) : (
                  waHistory.slice().reverse().map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.direction === 'outbound' ? 'bg-green-600 text-white rounded-br-none' : 'bg-zinc-800 text-white border border-white/10 rounded-bl-none'}`}>
                        <p>{msg.body}</p>
                        <p className="text-[10px] mt-1 opacity-70 text-right">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {msg.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/10 bg-zinc-900 rounded-b-2xl">
                <form onSubmit={sendWhatsApp} className="flex gap-2">
                  <input
                    value={waMessage}
                    onChange={e => setWaMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all"
                  />
                  <button type="submit" disabled={sendingWa || !waMessage.trim()} className="px-4 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    {sendingWa ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
