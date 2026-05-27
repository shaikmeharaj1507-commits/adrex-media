'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, ExternalLink, Loader2, Search, ArrowRight, ShieldCheck, Instagram, Youtube } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Influencer {
  id: string;
  name: string;
  email: string | null;
  niche: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  location: string | null;
  status: string;
  pricing: string | null;
}

export default function InfluencerPortalSelectorPage() {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const token = localStorage.getItem('adrex_token');
        const res = await fetch(`${API_URL}/api/influencers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setInfluencers(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch influencers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfluencers();
  }, []);

  const filteredInfluencers = influencers.filter(inf => 
    inf.name.toLowerCase().includes(search.toLowerCase()) ||
    (inf.niche || '').toLowerCase().includes(search.toLowerCase()) ||
    (inf.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <Award size={18} className="text-white" />
          </span>
          Influencer Portal Previews
        </h1>
        <p className="text-zinc-400 mt-1 ml-12">
          Generate, preview, and share custom dashboard links with creator partners. Influencers can view campaign invites, upload deliverables, and chat with their SPOC.
        </p>
      </div>

      {/* Info Warning */}
      <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 p-4 rounded-2xl flex items-start gap-3 ml-12">
        <ShieldCheck size={20} className="shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-semibold text-white">SPOC Integration:</span> Influencer dashboards are interactive. Creators can upload deliverables and send live messages that feed directly into your agency workspace in real-time.
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative ml-12">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input
          type="text"
          placeholder="Search creators by name, niche, location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      {/* Creator List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center ml-12">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : filteredInfluencers.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center ml-12">
          <Award className="text-zinc-600 mx-auto mb-3" size={32} />
          <h3 className="text-lg font-medium text-white mb-1">No influencers found</h3>
          <p className="text-zinc-400 text-sm">Please check your query or add a creator partner first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
          {filteredInfluencers.map((inf) => (
            <motion.div
              key={inf.id}
              whileHover={{ y: -2 }}
              onClick={() => router.push(`/dashboard/influencer-portal/${inf.id}`)}
              className="bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div>
                <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                  {inf.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Niche: {inf.niche || 'General'} • Location: {inf.location || 'Remote'}
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">
                    Status: {inf.status}
                  </span>
                  {inf.pricing && (
                    <span className="text-[10px] bg-purple-500/10 px-2 py-0.5 rounded text-purple-400 font-semibold">
                      Rate: {inf.pricing}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2 bg-white/5 rounded-xl group-hover:bg-purple-600 text-zinc-400 group-hover:text-white transition-all">
                <ArrowRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
