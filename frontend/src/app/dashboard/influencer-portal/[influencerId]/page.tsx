'use client';

import { use, useEffect, useState, useRef } from 'react';
import { API_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Share2, FileText, Megaphone, Users, Award, 
  DollarSign, CheckSquare, ShieldCheck, Mail, Phone, Loader2,
  Send, User, UploadCloud, Paperclip
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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

export default function InfluencerPortalDetailPage({ params }: { params: Promise<{ influencerId: string }> }) {
  const router = useRouter();
  const { influencerId } = use(params);
  
  const [data, setData] = useState<InfluencerPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // File upload state
  const [uploadName, setUploadName] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchPortalData = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencer-portal/${influencerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch influencer portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [influencerId]);

  useEffect(() => {
    // Scroll chat to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/dashboard/influencer-portal/${influencerId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || chatLoading) return;
    
    const content = msgInput.trim();
    setMsgInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencer-portal/${influencerId}/messages`, {
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

        // Optional: Trigger a mock auto-reply from SPOC to demonstrate chat
        setTimeout(async () => {
          try {
            const replyRes = await fetch(`${API_URL}/api/influencer-portal/${influencerId}/messages`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                content: `Hi ${data?.influencer.name}! I received your message. I'm checking campaign deliverables and will get back to you shortly.`, 
                isFromInfluencer: false 
              })
            });
            if (replyRes.ok) {
              const replyMsg = await replyRes.json();
              setData(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  messages: [...prev.messages, replyMsg]
                };
              });
            }
          } catch (e) {
            console.error('Mock reply failed:', e);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFileUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim() || !uploadUrl.trim() || uploading) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/influencer-portal/${influencerId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: uploadName,
          url: uploadUrl,
          size: 1024 * 1024 * 2.5, // 2.5 MB placeholder
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Portal Data Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">Could not load creator partner details.</p>
        <button 
          onClick={() => router.push('/dashboard/influencer-portal')} 
          className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
        >
          Back to Selection
        </button>
      </div>
    );
  }

  const { influencer, campaigns, deliverables, spoc, payouts, files, messages } = data;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/dashboard/influencer-portal')}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Portals
        </button>
        <button 
          onClick={handleShareLink}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        >
          <Share2 size={16} />
          {copied ? 'Link Copied!' : 'Copy Portal Link'}
        </button>
      </div>

      {/* Creator Header Display */}
      <div className="glassmorphism rounded-3xl p-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{influencer.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-400/10 text-purple-400 border border-purple-500/20">
              {influencer.status} Partner
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-2">
            Niche: <span className="text-white font-medium">{influencer.niche || 'General'}</span> • Location: <span className="text-white font-medium">{influencer.location || 'Remote'}</span>
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-zinc-500">
            {influencer.email && <span className="flex items-center gap-1"><Mail size={12} /> {influencer.email}</span>}
            {influencer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {influencer.phone}</span>}
          </div>
        </div>

        {influencer.pricing && (
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-right w-full md:w-auto">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Standard Pricing Rate</p>
            <p className="text-2xl font-black text-white mt-1">{influencer.pricing}</p>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Campaigns, Deliverables & Uploads */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Campaigns */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Megaphone size={16} className="text-purple-400" /> Active Campaign Invites ({campaigns.length})
            </h2>
            {campaigns.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-zinc-500 text-sm">
                No active campaign assignments found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map(c => (
                  <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/20 transition-all">
                    <h3 className="font-bold text-white text-base">{c.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{c.description || 'No description provided.'}</p>
                    <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                      <span>Start: {new Date(c.startDate).toLocaleDateString()}</span>
                      <span className="bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deliverables Checklist */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare size={16} className="text-purple-400" /> Campaign Deliverables Checklist ({deliverables.length})
            </h2>
            <div className="glassmorphism border border-white/10 rounded-2xl p-6 space-y-4">
              {deliverables.length === 0 ? (
                <p className="text-sm text-zinc-500 italic text-center py-4">No specific task deliverables assigned.</p>
              ) : (
                deliverables.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${d.status === 'DONE' ? 'bg-emerald-500' : d.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                      <div>
                        <h4 className="font-bold text-white text-sm">{d.title}</h4>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{d.campaignName} • Due: {d.dueDate || 'No deadline'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 px-2.5 py-0.5 rounded bg-white/5">
                      {d.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deliverable File Upload Widget */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud size={16} className="text-purple-400" /> Submit Content Deliverables
            </h2>
            <div className="glassmorphism border border-white/10 rounded-2xl p-6">
              <form onSubmit={handleFileUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Deliverable Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Instagram Video Draft" 
                      value={uploadName}
                      onChange={e => setUploadName(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Deliverable Link / URL</label>
                    <input 
                      type="url" 
                      placeholder="https://drive.google.com/file/..." 
                      value={uploadUrl}
                      onChange={e => setUploadUrl(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : 'Upload & Submit File'}
                </button>
              </form>

              {/* Uploaded List */}
              {files.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-300">Submitted Deliverables History</h4>
                  <div className="space-y-2">
                    {files.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs">
                        <span className="font-semibold text-white truncate max-w-[200px] flex items-center gap-1.5">
                          <Paperclip size={13} className="text-zinc-500" /> {f.name}
                        </span>
                        <a href={f.url} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Open Link</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: SPOC & Chat */}
        <div className="space-y-6">
          
          {/* Assigned SPOC Card */}
          {spoc && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-purple-400" /> Single Point of Contact (SPOC)
              </h2>
              <div className="glassmorphism border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-base font-bold shrink-0">
                  {spoc.firstName[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm">{spoc.firstName} {spoc.lastName}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Assigned Manager</p>
                  <p className="text-xs text-zinc-400 mt-1 truncate">{spoc.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* SPOC Live Chat */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              Live Chat
            </h2>
            <div className="glassmorphism border border-white/10 rounded-2xl flex flex-col h-[320px]">
              
              {/* Chat Messages window */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic">
                    Start a conversation with your SPOC.
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.isInfluencer ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs ${
                        m.isInfluencer ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white/5 text-white rounded-tl-none border border-white/10'
                      }`}>
                        <p className="font-bold text-[10px] mb-1 opacity-70">{m.senderName}</p>
                        <p className="leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type your message..."
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button 
                  type="submit"
                  disabled={!msgInput.trim() || chatLoading}
                  className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/95 disabled:opacity-50 transition-all shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* Influencer Payouts List */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-400" /> Payout Payout History
            </h2>
            <div className="glassmorphism border border-white/10 rounded-2xl p-5 space-y-4">
              {payouts.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-4">No payout records generated.</p>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {payouts.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-white/3 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs">
                      <div>
                        <h4 className="font-bold text-white">₹{p.amount.toLocaleString('en-IN')}</h4>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">{new Date(p.date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
                        PAID
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
