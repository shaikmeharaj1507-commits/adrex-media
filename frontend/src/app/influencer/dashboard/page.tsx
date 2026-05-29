'use client';

import { useEffect, useState, useRef } from 'react';
import { API_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Megaphone, Users, Award, 
  DollarSign, CheckSquare, ShieldCheck, Mail, Phone, Loader2,
  Send, User, UploadCloud, Paperclip, LogOut, Settings, MessageSquare, BarChart, Sparkles, MapPin, Globe, Award as Trophy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

interface Deliverable {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  priority: string;
  campaignName: string;
}

interface Payout {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  category: string;
}

interface PortalFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
}

interface PortalMessage {
  id: string;
  senderName: string;
  isInfluencer: boolean;
  content: string;
  createdAt: string;
}

interface InfluencerPortalData {
  influencer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    instagram: string | null;
    tiktok: string | null;
    youtube: string | null;
    niche: string | null;
    rating: number;
    location: string | null;
    status: string;
    pricing: string | null;
    audienceStats: string | null;
  };
  campaigns: Campaign[];
  deliverables: Deliverable[];
  spoc: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    avatar: string | null;
  } | null;
  payouts: Payout[];
  files: PortalFile[];
  messages: PortalMessage[];
}

export default function InfluencerDashboard() {
  const router = useRouter();
  const { logout } = useAuthStore();
  
  const [data, setData] = useState<InfluencerPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'earnings' | 'chat' | 'profile'>('overview');
  
  // Chat state
  const [msgInput, setMsgInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // File upload state
  const [uploadName, setUploadName] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Profile Edit form state
  const [profileForm, setProfileForm] = useState({
    whatsapp: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    niche: '',
    location: '',
    pricing: '',
    audienceStats: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const fetchPortalData = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencer-portal/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        
        // Pre-fill profile form
        setProfileForm({
          whatsapp: payload.influencer.whatsapp || '',
          instagram: payload.influencer.instagram || '',
          tiktok: payload.influencer.tiktok || '',
          youtube: payload.influencer.youtube || '',
          niche: payload.influencer.niche || '',
          location: payload.influencer.location || '',
          pricing: payload.influencer.pricing || '',
          audienceStats: payload.influencer.audienceStats || ''
        });
      } else if (res.status === 401 || res.status === 403) {
        logout();
        router.push('/influencer/login');
      }
    } catch (err) {
      console.error('Failed to fetch influencer portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.messages, activeTab]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* ignored */ }
    logout();
    router.push('/influencer/login');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || chatLoading || !data) return;
    
    const content = msgInput.trim();
    setMsgInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencer-portal/${data.influencer.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, isFromInfluencer: true })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, newMsg]
          };
        });
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFileUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim() || !uploadUrl.trim() || uploading || !data) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencer-portal/${data.influencer.id}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: uploadName,
          url: uploadUrl,
          size: 1024 * 1024 * 3.5, // 3.5 MB dummy size
          type: 'video/mp4'
        })
      });

      if (res.ok) {
        setUploadName('');
        setUploadUrl('');
        await fetchPortalData();
      }
    } catch (err) {
      console.error('Upload deliverable error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencer-portal/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      if (res.ok) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
        await fetchPortalData();
      }
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-pink-500 mb-4" size={40} />
        <p className="text-zinc-400 text-sm">Loading Creator Workspace...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
        <h2 className="text-xl font-bold text-white mb-2">Creator Profile Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">We could not retrieve an influencer profile linked to your user account.</p>
        <button onClick={handleLogout} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all">
          Logout
        </button>
      </div>
    );
  }

  const { influencer, campaigns, deliverables, spoc, payouts, files, messages } = data;

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Adrex Creator</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              {influencer.status} Partner
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors text-xs font-semibold"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar/List */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart },
            { id: 'campaigns', label: 'Campaigns & Tasks', icon: Megaphone },
            { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
            { id: 'chat', label: 'SPOC Chat', icon: MessageSquare },
            { id: 'profile', label: 'Profile Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                  active 
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-purple-500/40 text-white shadow-[0_0_15px_rgba(236,72,153,0.15)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={16} className={active ? 'text-pink-400' : 'text-zinc-400'} />
                {tab.label}
              </button>
            );
          })}

          {/* SPOC Info Card in aside */}
          {spoc && (
            <div className="mt-8 p-4 rounded-2xl glassmorphism border border-white/5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-base font-bold mx-auto">
                {spoc.firstName[0]}
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Your Partner Manager</p>
                <h4 className="font-bold text-white text-sm mt-0.5">{spoc.firstName} {spoc.lastName}</h4>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">{spoc.email}</p>
            </div>
          )}
        </aside>

        {/* Content Window */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Greeting */}
                  <div className="glassmorphism p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />
                    <div>
                      <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        Welcome Back, {influencer.name}!
                      </h1>
                      <p className="text-zinc-400 text-sm mt-2">
                        Category: <span className="text-white font-semibold">{influencer.niche || 'Not Specified'}</span> • Base Location: <span className="text-white font-semibold">{influencer.location || 'Remote'}</span>
                      </p>
                    </div>
                    {influencer.pricing && (
                      <div className="bg-white/5 border border-white/10 p-4 px-6 rounded-2xl text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Standard Collaborations Rate</p>
                        <p className="text-xl font-black text-white mt-0.5">{influencer.pricing}</p>
                      </div>
                    )}
                  </div>

                  {/* Overview Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                        <Megaphone size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-semibold">Campaign Invites</p>
                        <p className="text-xl font-bold text-white mt-0.5">{campaigns.length}</p>
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                        <CheckSquare size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-semibold">Pending Tasks</p>
                        <p className="text-xl font-bold text-white mt-0.5">
                          {deliverables.filter(d => d.status !== 'DONE').length}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl glassmorphism border border-white/5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-semibold">Completed Payouts</p>
                        <p className="text-xl font-bold text-white mt-0.5">{payouts.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick updates panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent deliverables */}
                    <div className="glassmorphism p-6 rounded-2xl border border-white/5 space-y-4">
                      <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <CheckSquare size={16} className="text-pink-400" /> Upcoming Deadlines
                      </h3>
                      {deliverables.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic py-4">No task deliverables assigned.</p>
                      ) : (
                        <div className="space-y-3">
                          {deliverables.slice(0, 3).map(d => (
                            <div key={d.id} className="flex justify-between items-center p-3 bg-white/3 border border-white/5 rounded-xl text-xs">
                              <div>
                                <p className="font-bold text-white">{d.title}</p>
                                <span className="text-[10px] text-zinc-500 block mt-0.5">Due: {d.dueDate || 'No deadline'}</span>
                              </div>
                              <span className="bg-pink-500/15 text-pink-400 px-2 py-0.5 rounded text-[10px] font-semibold">{d.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chat snippet */}
                    <div className="glassmorphism p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                          <MessageSquare size={16} className="text-pink-400" /> Messages Quick View
                        </h3>
                        {messages.length === 0 ? (
                          <p className="text-xs text-zinc-500 italic py-4">No recent messages.</p>
                        ) : (
                          <div className="space-y-2">
                            {messages.slice(-2).map(m => (
                              <div key={m.id} className="p-2.5 bg-white/3 border border-white/5 rounded-xl text-xs">
                                <span className="font-bold text-[10px] text-pink-400 block">{m.senderName}</span>
                                <p className="text-zinc-300 mt-0.5 truncate">{m.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => setActiveTab('chat')} className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-all">
                        Open Full Live Chat
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CAMPAIGNS & TASKS */}
              {activeTab === 'campaigns' && (
                <div className="space-y-6">
                  {/* Campaign Invites */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Megaphone size={18} className="text-pink-400" /> Assigned Campaign Invites
                    </h2>
                    {campaigns.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-zinc-500 text-sm">
                        No active campaigns.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {campaigns.map(c => (
                          <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-pink-500/20 transition-all">
                            <h3 className="font-bold text-white text-base">{c.name}</h3>
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-3">{c.description || 'No description provided.'}</p>
                            <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                              <span>Start: {new Date(c.startDate).toLocaleDateString()}</span>
                              <span className="bg-pink-500/15 text-pink-400 px-2 py-0.5 rounded-full font-bold">{c.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <CheckSquare size={18} className="text-pink-400" /> Deliverables Checklist
                    </h2>
                    <div className="glassmorphism border border-white/10 rounded-2xl p-6 space-y-3">
                      {deliverables.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic text-center py-4">No task deliverables assigned.</p>
                      ) : (
                        deliverables.map(d => (
                          <div key={d.id} className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl text-xs">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full shrink-0 ${d.status === 'DONE' ? 'bg-emerald-500' : d.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                              <div>
                                <h4 className="font-bold text-white">{d.title}</h4>
                                <span className="text-[10px] text-zinc-500 block mt-0.5">{d.campaignName} • Due: {d.dueDate || 'No deadline'}</span>
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-0.5 rounded bg-white/5">
                              {d.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Submit Content deliverable form */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <UploadCloud size={18} className="text-pink-400" /> Submit Content Link
                    </h2>
                    <div className="glassmorphism border border-white/10 rounded-2xl p-6">
                      <form onSubmit={handleFileUploadSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Deliverable Name / Title</label>
                            <input 
                              type="text" 
                              placeholder="e.g. YouTube Video Draft" 
                              value={uploadName}
                              onChange={e => setUploadName(e.target.value)}
                              required
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Submission Link (Google Drive, Dropbox, Loom, etc.)</label>
                            <input 
                              type="url" 
                              placeholder="https://drive.google.com/file/d/..." 
                              value={uploadUrl}
                              onChange={e => setUploadUrl(e.target.value)}
                              required
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={uploading}
                          className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          {uploading ? <Loader2 size={14} className="animate-spin" /> : 'Submit Deliverable'}
                        </button>
                      </form>

                      {/* Submitted History List */}
                      {files.length > 0 && (
                        <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
                          <h4 className="text-xs font-bold text-zinc-300">Submitted Deliverables History</h4>
                          <div className="space-y-2">
                            {files.map(f => (
                              <div key={f.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs">
                                <span className="font-semibold text-white truncate max-w-[200px] flex items-center gap-1.5">
                                  <Paperclip size={13} className="text-zinc-500" /> {f.name}
                                </span>
                                <a href={f.url} target="_blank" rel="noreferrer" className="text-pink-400 hover:underline">Open Link</a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EARNINGS & PAYOUTS */}
              {activeTab === 'earnings' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <DollarSign size={18} className="text-pink-400" /> Earnings & Invoices
                    </h2>
                    <div className="glassmorphism border border-white/10 rounded-2xl p-6 space-y-4">
                      {payouts.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic text-center py-4">No payout records generated yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {payouts.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3.5 bg-white/3 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs">
                              <div>
                                <h4 className="font-bold text-white text-sm">₹{p.amount.toLocaleString('en-IN')}</h4>
                                <span className="text-[10px] text-zinc-500 block mt-0.5">{new Date(p.date).toLocaleDateString()} • {p.description || 'Campaign Payout'}</span>
                              </div>
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                                PAID
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rates Info display */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 to-transparent border border-pink-500/20">
                    <h3 className="font-bold text-sm text-pink-400">Collaboration Contract Notes</h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Your payout schedules are processed automatically within 15-30 days of submission review. If you need assistance with invoices or custom deliverables rates, please ping your assigned manager in the SPOC Chat tab.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: SPOC CHAT */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-pink-400" /> Single Point of Contact Chat
                  </h2>
                  <div className="glassmorphism border border-white/10 rounded-2xl flex flex-col h-[450px]">
                    
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic">
                          Start a conversation with your SPOC / Manager.
                        </div>
                      ) : (
                        messages.map(m => (
                          <div key={m.id} className={`flex flex-col ${m.isInfluencer ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-md ${
                              m.isInfluencer 
                                ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-tr-none' 
                                : 'bg-white/5 text-white rounded-tl-none border border-white/10'
                            }`}>
                              <p className="font-bold text-[9px] mb-1 opacity-70">{m.senderName}</p>
                              <p className="leading-relaxed">{m.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type your message to SPOC..."
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500 placeholder-zinc-500"
                      />
                      <button 
                        type="submit"
                        disabled={!msgInput.trim() || chatLoading}
                        className="p-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shrink-0 border-0"
                      >
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: PROFILE SETTINGS */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Settings size={18} className="text-pink-400" /> Creator Profile Settings
                    </h2>
                    <div className="glassmorphism border border-white/10 rounded-2xl p-6">
                      
                      {profileSuccess && (
                        <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                          <ShieldCheck size={16} />
                          Profile settings updated successfully!
                        </div>
                      )}

                      <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">WhatsApp / Phone Number</label>
                            <input 
                              type="text" 
                              value={profileForm.whatsapp}
                              onChange={e => setProfileForm(p => ({ ...p, whatsapp: e.target.value }))}
                              placeholder="+1 (555) 019-2834"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Base Location</label>
                            <input 
                              type="text" 
                              value={profileForm.location}
                              onChange={e => setProfileForm(p => ({ ...p, location: e.target.value }))}
                              placeholder="New York, USA"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Niche / Category</label>
                            <input 
                              type="text" 
                              value={profileForm.niche}
                              onChange={e => setProfileForm(p => ({ ...p, niche: e.target.value }))}
                              placeholder="Tech, Fashion, Gaming"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Pricing / Standard Rates</label>
                            <input 
                              type="text" 
                              value={profileForm.pricing}
                              onChange={e => setProfileForm(p => ({ ...p, pricing: e.target.value }))}
                              placeholder="$1,200 per Dedicated Reel"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                          </div>
                        </div>

                        {/* Social Handles */}
                        <div className="border-t border-white/5 pt-4 space-y-4">
                          <h4 className="text-xs font-bold text-zinc-300">Social Media Channels</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Instagram Handle</label>
                              <input 
                                type="text" 
                                value={profileForm.instagram}
                                onChange={e => setProfileForm(p => ({ ...p, instagram: e.target.value }))}
                                placeholder="@username"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">TikTok Handle</label>
                              <input 
                                type="text" 
                                value={profileForm.tiktok}
                                onChange={e => setProfileForm(p => ({ ...p, tiktok: e.target.value }))}
                                placeholder="@username"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">YouTube Channel</label>
                              <input 
                                type="text" 
                                value={profileForm.youtube}
                                onChange={e => setProfileForm(p => ({ ...p, youtube: e.target.value }))}
                                placeholder="Channel Link or Name"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Audience Demographics */}
                        <div className="border-t border-white/5 pt-4">
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Audience Demographics & Stats</label>
                          <textarea 
                            rows={3}
                            value={profileForm.audienceStats}
                            onChange={e => setProfileForm(p => ({ ...p, audienceStats: e.target.value }))}
                            placeholder="65% Female audience, top countries: US, Germany. Strong engagement with 18-34 age brackets."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
                          />
                        </div>

                        <button 
                          type="submit" 
                          disabled={savingProfile}
                          className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          {savingProfile ? <Loader2 size={14} className="animate-spin" /> : 'Save Profile Settings'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
