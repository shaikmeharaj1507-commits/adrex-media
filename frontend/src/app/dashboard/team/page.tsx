'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MoreHorizontal, User, Shield, ShieldAlert, Mail, Trash2, X, Edit2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

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
  
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'TEAM_MEMBER',
    password: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: 'TEAM_MEMBER',
    isActive: true,
  });

  const handleEditClick = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({
      firstName: member.firstName,
      lastName: member.lastName,
      role: member.role,
      isActive: member.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const updated = await res.json();
        setTeam(prev => prev.map(m => m.id === editingMember.id ? { ...m, ...updated } : m));
        setShowEditModal(false);
        setEditingMember(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update member');
      }
    } catch (error) {
      console.error('Update member failed', error);
    }
  };

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

  const filteredTeam = team.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage agency members, roles, and access.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Plus size={18} /> Invite Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Members', value: loading ? '-' : team.length, icon: User, color: 'text-blue-400' },
          { label: 'Active Now', value: loading ? '-' : team.filter(t => t.isActive).length, icon: Shield, color: 'text-emerald-400' },
          { label: 'Admins', value: loading ? '-' : team.filter(t => t.role === 'SUPER_ADMIN').length, icon: ShieldAlert, color: 'text-purple-400' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl glassmorphism flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${s.color}`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{s.label}</p>
              <p className="text-2xl font-bold text-white mt-0.5">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" placeholder="Search team members by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all backdrop-blur-md" />
      </div>

      <motion.div className="glassmorphism rounded-2xl overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Member</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Role</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Status</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Joined</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500 animate-pulse">Loading team...</td></tr>
              ) : filteredTeam.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-zinc-500">No members found.</td></tr>
              ) : filteredTeam.map((m, i) => (
                <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
                        {m.firstName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{m.firstName} {m.lastName} {user?.id === m.id && <span className="text-xs text-zinc-500 font-normal ml-1">(You)</span>}</p>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                          <Mail size={10} /> {m.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      m.role === 'SUPER_ADMIN' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25' :
                      m.role === 'MANAGER' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :
                      'bg-zinc-500/15 text-zinc-300 border border-zinc-500/25'
                    }`}>
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${m.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'}`} />
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-xs">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && m.id !== user?.id && (
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleEditClick(m)} className="p-2 rounded-lg text-zinc-500 hover:bg-purple-500/10 hover:text-purple-400 transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
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
            <motion.div className="relative z-10 w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
                  <p className="text-sm text-zinc-400 mt-1">Add a new user to your agency workspace.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">First Name</label>
                    <input type="text" required value={newMember.firstName} onChange={e => setNewMember(p => ({...p, firstName: e.target.value}))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Last Name</label>
                    <input type="text" required value={newMember.lastName} onChange={e => setNewMember(p => ({...p, lastName: e.target.value}))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address</label>
                  <input type="email" required value={newMember.email} onChange={e => setNewMember(p => ({...p, email: e.target.value}))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Role</label>
                    <select value={newMember.role} onChange={e => setNewMember(p => ({...p, role: e.target.value}))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors">
                      <option value="TEAM_MEMBER">Team Member</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Temporary Password</label>
                    <input type="text" required value={newMember.password} onChange={e => setNewMember(p => ({...p, password: e.target.value}))} placeholder="AdrexMedia123!"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors" />
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingMember && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setEditingMember(null); }} />
            <motion.div className="relative z-10 w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Team Member</h2>
                  <p className="text-sm text-zinc-400 mt-1">Update profile, role, and workspace access.</p>
                </div>
                <button onClick={() => { setShowEditModal(false); setEditingMember(null); }} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleUpdateMember} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">First Name</label>
                    <input type="text" required value={editForm.firstName} onChange={e => setEditForm(p => ({...p, firstName: e.target.value}))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Last Name</label>
                    <input type="text" required value={editForm.lastName} onChange={e => setEditForm(p => ({...p, lastName: e.target.value}))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm(p => ({...p, role: e.target.value}))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors">
                    <option value="TEAM_MEMBER">Team Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-sm font-semibold text-white">Active Status</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Toggle user's ability to log in and access data.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditForm(p => ({ ...p, isActive: !p.isActive }))}
                    className={`w-11 h-6 rounded-full transition-all relative ${editForm.isActive ? 'bg-purple-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${editForm.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="pt-4 mt-6 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => { setShowEditModal(false); setEditingMember(null); }} className="px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    Save Changes
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
