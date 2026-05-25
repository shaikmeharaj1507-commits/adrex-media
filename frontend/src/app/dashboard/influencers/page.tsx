'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Mail, MessageCircle, MoreVertical, X, Sparkles, Loader2, MessageSquare, Send, Star, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface Influencer {
  id: string;
  name: string;
  niche: string | null;
  platform: string; // derived from youtube/tiktok/instagram mostly
  followers: string; // we'll use rating for now, or just mock string
  rating: number;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
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
  const [newInf, setNewInf] = useState({ name: '', niche: '', platform: 'Instagram', followers: '100K', rating: 5, instagram: '', tiktok: '', youtube: '' });

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
    // In a real app we'd use inf.phone. For demo, we use a placeholder:
    fetchWaHistory('+1234567890');
  };

  const sendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waMessage.trim() || !showWhatsApp) return;
    setSendingWa(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ to: '+1234567890', body: waMessage }) // Placeholder to number
      });
      if (res.ok) {
        setWaMessage('');
        fetchWaHistory('+1234567890');
      }
    } catch (error) { console.error('Failed to send WA', error); } 
    finally { setSendingWa(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInf.name) return;

    try {
      const token = localStorage.getItem('adrex_token');
      const payload = {
        name: newInf.name,
        niche: newInf.niche,
        instagram: newInf.platform === 'Instagram' ? newInf.followers : '',
        tiktok: newInf.platform === 'TikTok' ? newInf.followers : '',
        youtube: newInf.platform === 'YouTube' ? newInf.followers : '',
        rating: newInf.rating
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
        setNewInf({ name: '', niche: '', platform: 'Instagram', followers: '100K', rating: 5, instagram: '', tiktok: '', youtube: '' });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to create influencer', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInfluencer) return;

    try {
      const token = localStorage.getItem('adrex_token');
      const payload = {
        name: newInf.name,
        niche: newInf.niche,
        instagram: newInf.platform === 'Instagram' ? newInf.followers : '',
        tiktok: newInf.platform === 'TikTok' ? newInf.followers : '',
        youtube: newInf.platform === 'YouTube' ? newInf.followers : '',
        rating: newInf.rating
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

  const openEditModal = (inf: Influencer) => {
    const plat = getPlatform(inf);
    setEditingInfluencer(inf);
    setNewInf({
      name: inf.name,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Influencer CRM</h1>
          <p className="text-muted-foreground mt-1">Manage your roster of content creators.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Plus size={18} />
          <span>Add Influencer</span>
        </button>
      </div>

      <div className="glassmorphism rounded-2xl p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, niche, or platform..." 
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Niche</th>
                <th className="pb-3 font-medium">Primary Platform</th>
                <th className="pb-3 font-medium">Followers</th>
                <th className="pb-3 font-medium">Rating</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground animate-pulse">Loading influencers...</td></tr>
              ) : influencers.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No influencers found. Add one above.</td></tr>
              ) : influencers.map((inf) => {
                const plat = getPlatform(inf);
                return (
                  <tr key={inf.id} className="border-b border-border/10 hover:bg-white/5 transition-colors group">
                    <td className="py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-primary font-bold text-xs">
                        {inf.name.charAt(0).toUpperCase()}
                      </div>
                      {inf.name}
                    </td>
                    <td className="py-4 text-muted-foreground">{inf.niche || 'N/A'}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                        {plat.name}
                      </span>
                    </td>
                    <td className="py-4 font-medium">{plat.followers}</td>
                    <td className="py-4">
                      <div className="flex gap-1 text-yellow-500">
                        {[...Array(inf.rating || 0)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
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
                          <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden text-left">
                            <button onClick={() => openEditModal(inf)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-all">
                              <Pencil size={13} /> Edit
                            </button>
                            <button onClick={() => handleDelete(inf.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all">
                              <Trash2 size={13} /> Delete
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
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-md glassmorphism rounded-2xl p-8"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{editingInfluencer ? 'Edit Influencer' : 'Add Influencer'}</h2>
                <button onClick={() => { setShowModal(false); setEditingInfluencer(null); }} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <form className="space-y-4" onSubmit={editingInfluencer ? handleUpdate : handleCreate}>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Name</label>
                  <input value={newInf.name} onChange={e => setNewInf(p => ({ ...p, name: e.target.value }))}
                    type="text" placeholder="e.g. Sarah Chen" required
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Niche</label>
                    <input value={newInf.niche} onChange={e => setNewInf(p => ({ ...p, niche: e.target.value }))}
                      type="text" placeholder="e.g. Tech, Beauty" 
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Rating (1-5)</label>
                    <input value={newInf.rating} onChange={e => setNewInf(p => ({ ...p, rating: parseInt(e.target.value) || 0 }))}
                      type="number" min={1} max={5}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Platform</label>
                    <select value={newInf.platform} onChange={e => setNewInf(p => ({ ...p, platform: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Followers</label>
                    <input value={newInf.followers} onChange={e => setNewInf(p => ({ ...p, followers: e.target.value }))}
                      type="text" placeholder="e.g. 150K" 
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] mt-4">
                  {editingInfluencer ? 'Update Influencer' : 'Add Influencer'}
                </button>
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
