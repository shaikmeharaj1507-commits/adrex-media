'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Search, Target, MoreHorizontal, Megaphone, X, Sparkles, Loader2,
  Users, UserPlus, Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE:    { color: 'text-emerald-400', bg: 'bg-emerald-400/10',  label: 'Active' },
  DRAFT:     { color: 'text-slate-400',   bg: 'bg-slate-400/10',    label: 'Draft' },
  PLANNED:   { color: 'text-blue-400',    bg: 'bg-blue-400/10',     label: 'Planned' },
  COMPLETED: { color: 'text-purple-400',  bg: 'bg-purple-400/10',   label: 'Completed' },
  PAUSED:    { color: 'text-amber-400',   bg: 'bg-amber-400/10',    label: 'Paused' },
};

interface Assignment {
  user?: { id: string; firstName: string; lastName: string } | null;
  team?: { id: string; name: string } | null;
  influencer?: { id: string; name: string } | null;
}

interface Campaign {
  id: string;
  name: string;
  client: { companyName: string };
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  assignments?: Assignment[];
}

interface TeamGroup {
  id: string;
  name: string;
  members: { id: string; firstName: string; lastName: string }[];
}

export default function CampaignsPage() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [newCamp, setNewCamp] = useState({
    name: '', clientId: '', budget: '', status: 'DRAFT', startDate: '', endDate: '', description: '',
    assignedUserIds: [] as string[], assignedTeamIds: [] as string[]
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const fetches: Promise<Response>[] = [
        fetch(`${API_URL}/api/campaigns`, { headers }),
        fetch(`${API_URL}/api/clients`, { headers })
      ];
      if (isAdmin) {
        fetches.push(fetch(`${API_URL}/api/team`, { headers }));
        fetches.push(fetch(`${API_URL}/api/team/groups`, { headers }));
      }
      const results = await Promise.all(fetches);
      if (results[0].ok) setCampaigns(await results[0].json());
      if (results[1].ok) setClients(await results[1].json());
      if (isAdmin && results[2]?.ok) setTeamMembers(await results[2].json());
      if (isAdmin && results[3]?.ok) setTeamGroups(await results[3].json());
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time sync
  useEffect(() => {
    if (!socket) return;
    const handler = () => { fetchData(); };
    socket.on('campaign_updated', handler);
    return () => { socket.off('campaign_updated', handler); };
  }, [socket, fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.name || !newCamp.clientId || !newCamp.startDate || !newCamp.endDate || isSubmitting) return;
    setIsSubmitting(true);
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
        resetModal();
      }
    } catch (error) {
      console.error('Failed to create campaign', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newCamp)
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
        resetModal();
      }
    } catch (error) {
      console.error('Failed to update campaign', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete campaign', error);
    }
  };

  const resetModal = () => {
    setNewCamp({ name: '', clientId: '', budget: '', status: 'DRAFT', startDate: '', endDate: '', description: '', assignedUserIds: [], assignedTeamIds: [] });
    setAiSuggested(false);
    setShowModal(false);
    setEditingCampaign(null);
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setNewCamp({
      name: campaign.name,
      clientId: '',
      budget: String(campaign.budget),
      status: campaign.status,
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      description: '',
      assignedUserIds: campaign.assignments?.filter(a => a.user).map(a => a.user!.id) || [],
      assignedTeamIds: campaign.assignments?.filter(a => a.team).map(a => a.team!.id) || []
    });
    setShowModal(true);
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

  const toggleUserId = (id: string) => {
    setNewCamp(prev => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(id)
        ? prev.assignedUserIds.filter(uid => uid !== id)
        : [...prev.assignedUserIds, id]
    }));
  };

  const toggleTeamId = (id: string) => {
    setNewCamp(prev => ({
      ...prev,
      assignedTeamIds: prev.assignedTeamIds.includes(id)
        ? prev.assignedTeamIds.filter(tid => tid !== id)
        : [...prev.assignedTeamIds, id]
    }));
  };

  const filtered = useMemo(() => campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.client?.companyName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [campaigns, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Manage and track all your marketing campaigns.' : 'View campaigns assigned to you.'}
          </p>
        </div>
        {isAdmin && (
          <button id="new-campaign-btn" onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Plus size={18} /> New Campaign
          </button>
        )}
      </div>

      <div className={`grid grid-cols-2 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
        {[
          { label: 'Total Campaigns', value: loading ? '-' : campaigns.length, sub: 'All time' },
          { label: 'Active Now', value: loading ? '-' : campaigns.filter(c => c.status === 'ACTIVE').length, sub: 'Running' },
          isAdmin ? { label: 'Total Budget', value: loading ? '-' : `₹${campaigns.reduce((a,c) => a + c.budget, 0).toLocaleString('en-IN')}`, sub: 'Allocated' } : null,
          { label: 'Completed', value: loading ? '-' : campaigns.filter(c => c.status === 'COMPLETED').length, sub: 'Finished' },
        ].filter((s): s is { label: string; value: string | number; sub: string } => s !== null).map((s, i) => (
          <div key={i} className="p-4 rounded-xl glassmorphism">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
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

      <div className="glassmorphism rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Campaign</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Client</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Budget</th>
                {isAdmin && <th className="text-left px-6 py-4 text-muted-foreground font-medium">Assigned</th>}
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Timeline</th>
                {isAdmin && <th className="px-6 py-4"></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 7 : 5} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading campaigns...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 5} className="px-6 py-16 text-center text-muted-foreground">
                  <Target size={40} className="mx-auto mb-3 opacity-30" />
                  <p>{isAdmin ? 'No campaigns found. Create one above!' : 'No campaigns assigned to you.'}</p>
                </td></tr>
              ) : filtered.map((c) => {
                const st = statusConfig[c.status] || statusConfig.DRAFT;
                const assignedUsers = c.assignments?.filter(a => a.user).map(a => a.user!) || [];
                const assignedTeams = c.assignments?.filter(a => a.team).map(a => a.team!) || [];
                return (
                  <tr key={c.id} className="border-b border-border/30 hover:bg-white/3 transition-colors group">
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
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {assignedUsers.slice(0, 2).map(u => (
                            <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <UserPlus size={10} /> {u.firstName}
                            </span>
                          ))}
                          {assignedTeams.slice(0, 2).map(t => (
                            <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <Users size={10} /> {t.name}
                            </span>
                          ))}
                          {(assignedUsers.length + assignedTeams.length) === 0 && (
                            <span className="text-xs text-zinc-500">Unassigned</span>
                          )}
                          {(assignedUsers.length + assignedTeams.length) > 4 && (
                            <span className="text-[10px] text-zinc-500">+{assignedUsers.length + assignedTeams.length - 4} more</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="relative group/more">
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(c); }} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                            <MoreHorizontal size={16} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all z-10">
                            <button onClick={() => openEditModal(c)} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-t-xl">Edit</button>
                            <button onClick={() => handleDelete(c.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-b-xl">Delete</button>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetModal} />
          <div className="relative z-10 w-full max-w-lg bg-zinc-900/95 border border-white/15 rounded-2xl p-8 shadow-2xl animate-in slide-in-from-bottom-2 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h2>
                <p className="text-sm text-zinc-500 mt-0.5">{editingCampaign ? 'Update the campaign details.' : 'Fill in the details or use AI to spark ideas.'}</p>
              </div>
              <button onClick={resetModal} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
            </div>

            <form className="space-y-4" onSubmit={editingCampaign ? handleUpdate : handleCreate}>
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
                </div>
                <input value={newCamp.name} onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))} type="text" placeholder="e.g. Summer Glow 2025" required
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
              </div>

              {!editingCampaign && aiSuggested && newCamp.description && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-medium text-purple-300 mb-1">✦ AI Brief</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{newCamp.description}</p>
                </div>
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
                    <option value="PAUSED">PAUSED</option>
                    <option value="COMPLETED">COMPLETED</option>
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

              {/* Assignment Section */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-purple-400" />
                  <label className="text-sm font-semibold text-zinc-200">Assign Access</label>
                </div>

                {/* Assign Individual Members */}
                {teamMembers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-zinc-400 mb-2 font-medium">Team Members</p>
                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                      {teamMembers.filter((m: any) => m.role !== 'SUPER_ADMIN' && m.role !== 'MANAGER').map((m: any) => (
                        <button key={m.id} type="button" onClick={() => toggleUserId(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            newCamp.assignedUserIds.includes(m.id)
                              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20'
                          }`}>
                          {m.firstName} {m.lastName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assign Teams */}
                {teamGroups.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-2 font-medium">Teams</p>
                    <div className="flex flex-wrap gap-2">
                      {teamGroups.map(t => (
                        <button key={t.id} type="button" onClick={() => toggleTeamId(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            newCamp.assignedTeamIds.includes(t.id)
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20'
                          }`}>
                          <Users size={12} /> {t.name}
                          <span className="text-[10px] opacity-60">({t.members?.length || 0})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {editingCampaign && (
                  <button type="button" onClick={() => { handleDelete(editingCampaign.id); resetModal(); }}
                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-xl font-semibold transition-all">
                    Delete Campaign
                  </button>
                )}
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      {editingCampaign ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingCampaign ? 'Update Campaign' : 'Create Campaign'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
