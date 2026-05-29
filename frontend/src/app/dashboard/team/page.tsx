'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreHorizontal, User, Shield, ShieldAlert, Mail, Trash2, X, Edit2, Download } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import AccessRestricted from '@/components/AccessRestricted';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function TeamPage() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'TEAM_MEMBER',
    password: ''
  });

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTeam(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch team', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newMember)
      });
      if (res.ok) {
        const added = await res.json();
        setTeam(prev => [...prev, added]);
        setShowModal(false);
        setNewMember({ firstName: '', lastName: '', email: '', role: 'TEAM_MEMBER', password: '' });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Add member failed', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingMember)
      });
      if (res.ok) {
        const updated = await res.json();
        setTeam(prev => prev.map(m => m.id === updated.id ? updated : m));
        setEditingMember(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update member');
      }
    } catch (error) {
      console.error('Edit member failed', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTeam(prev => prev.filter(m => m.id !== id));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete failed', error);
    }
  };
  const handleExportCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const rows = team.map(m => [
      `"${m.firstName.replace(/"/g, '""')}"`,
      `"${m.lastName.replace(/"/g, '""')}"`,
      `"${m.email.replace(/"/g, '""')}"`,
      m.role,
      m.isActive ? 'Active' : 'Inactive',
      new Date(m.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adrex-team-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const filteredTeam = team.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  if (!isAdmin) {
    return <AccessRestricted />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage agency members, roles, and access.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-border hover:bg-muted/80 text-foreground rounded-xl font-semibold transition-all">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:opacity-95 transition-all shadow-sm">
              <Plus size={18} /> Invite Member
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Members', value: loading ? '-' : team.length, icon: User, color: 'text-blue-600' },
          { label: 'Active Now', value: loading ? '-' : team.filter(t => t.isActive).length, icon: Shield, color: 'text-emerald-600' },
          { label: 'Admins', value: loading ? '-' : team.filter(t => t.role === 'SUPER_ADMIN').length, icon: ShieldAlert, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search team members by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all backdrop-blur-md" />
      </div>

      <motion.div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Member</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Role</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Status</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Joined</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground animate-pulse">Loading team...</td></tr>
              ) : filteredTeam.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">No members found.</td></tr>
              ) : filteredTeam.map((m, i) => (
                <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => { if(isAdmin) setSelectedMember(m); }}
                  className={`border-b border-border/40 hover:bg-muted/50 transition-colors group ${isAdmin ? 'cursor-pointer' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                        {m.firstName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{m.firstName} {m.lastName} {user?.id === m.id && <span className="text-xs text-muted-foreground font-normal ml-1">(You)</span>}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Mail size={10} /> {m.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      m.role === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary border border-primary/20' :
                      m.role === 'MANAGER' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${m.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/60'}`} />
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAdmin && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingMember(m); }} 
                          className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {isAdmin && m.id !== user?.id && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} 
                          className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Invite Team Member</h2>
                  <p className="text-sm text-muted-foreground mt-1">Add a new user to your agency workspace.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                    <input type="text" required value={newMember.firstName} onChange={e => setNewMember(p => ({...p, firstName: e.target.value}))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                    <input type="text" required value={newMember.lastName} onChange={e => setNewMember(p => ({...p, lastName: e.target.value}))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Address</label>
                  <input type="email" required value={newMember.email} onChange={e => setNewMember(p => ({...p, email: e.target.value}))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
                    <select value={newMember.role} onChange={e => setNewMember(p => ({...p, role: e.target.value}))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="INFLUENCER_MANAGER">Influencer Manager</option>
                      <option value="SALES_TEAM">Sales Team</option>
                      <option value="VIDEO_EDITOR">Video Editor</option>
                      <option value="PERFORMANCE_MARKETER">Performance Marketer</option>
                      <option value="SOCIAL_MEDIA_MANAGER">Social Media Manager</option>
                      <option value="INFLUENCER">Influencer</option>
                      <option value="TEAM_MEMBER">General Team Member</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Temporary Password</label>
                    <input type="text" required value={newMember.password} onChange={e => setNewMember(p => ({...p, password: e.target.value}))} placeholder="AdrexMedia123!"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-border/50 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-95 transition-all shadow-sm">
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingMember(null)} />
            <motion.div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Edit Team Member</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update user details and access.</p>
                </div>
                <button onClick={() => setEditingMember(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                    <input type="text" required value={editingMember.firstName} onChange={e => setEditingMember(p => p ? {...p, firstName: e.target.value} : null)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                    <input type="text" required value={editingMember.lastName} onChange={e => setEditingMember(p => p ? {...p, lastName: e.target.value} : null)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Address</label>
                  <input type="email" required value={editingMember.email} onChange={e => setEditingMember(p => p ? {...p, email: e.target.value} : null)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
                    <select value={editingMember.role} onChange={e => setEditingMember(p => p ? {...p, role: e.target.value} : null)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="INFLUENCER_MANAGER">Influencer Manager</option>
                      <option value="SALES_TEAM">Sales Team</option>
                      <option value="VIDEO_EDITOR">Video Editor</option>
                      <option value="PERFORMANCE_MARKETER">Performance Marketer</option>
                      <option value="SOCIAL_MEDIA_MANAGER">Social Media Manager</option>
                      <option value="INFLUENCER">Influencer</option>
                      <option value="TEAM_MEMBER">General Team Member</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                    <select value={editingMember.isActive ? 'true' : 'false'} onChange={e => setEditingMember(p => p ? {...p, isActive: e.target.value === 'true'} : null)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-border/50 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingMember(null)} className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-95 transition-all shadow-sm">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Official Team Member Profile Modal (Admins Only) */}
      <AnimatePresence>
        {selectedMember && isAdmin && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
            <motion.div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              
              <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b border-border flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20 shadow-inner">
                    {selectedMember.firstName[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedMember.firstName} {selectedMember.lastName}</h2>
                    <p className="text-sm text-primary font-medium tracking-wide">{selectedMember.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Email Address</p>
                    <p className="text-sm text-foreground font-medium flex items-center gap-2 truncate" title={selectedMember.email}>
                      <Mail size={14} className="text-muted-foreground shrink-0"/> {selectedMember.email}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Status</p>
                    <p className="text-sm text-foreground font-medium flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${selectedMember.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {selectedMember.isActive ? 'Active Member' : 'Inactive Account'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Join Date</p>
                    <p className="text-sm text-foreground font-medium">{new Date(selectedMember.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">System ID</p>
                    <p className="text-xs text-muted-foreground font-mono truncate" title={selectedMember.id}>{selectedMember.id}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
                  <button onClick={() => setSelectedMember(null)} className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold rounded-xl transition-all">
                    Close Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
