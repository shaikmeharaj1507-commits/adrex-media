'use client';

import { use, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, AlertCircle, Megaphone, Users, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AccessRestricted from '@/components/AccessRestricted';

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

const statusConfig: Record<string, { color: string; bg: string; label: string; border: string }> = {
  ACTIVE:    { color: 'text-emerald-400', bg: 'bg-emerald-400/10',  border: 'border-emerald-500/20', label: 'Active' },
  DRAFT:     { color: 'text-slate-400',   bg: 'bg-slate-400/10',    border: 'border-slate-500/20',   label: 'Draft' },
  PLANNED:   { color: 'text-blue-400',    bg: 'bg-blue-400/10',     border: 'border-blue-500/20',    label: 'Planned' },
  COMPLETED: { color: 'text-purple-400',  bg: 'bg-purple-400/10',   border: 'border-purple-500/20',  label: 'Completed' },
  PAUSED:    { color: 'text-amber-400',   bg: 'bg-amber-400/10',    border: 'border-amber-500/20',   label: 'Paused' },
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const token = localStorage.getItem('adrex_token');
        const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setCampaign(data);
        } else {
          setError(res.status);
        }
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(500);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error === 403 || error === 401) {
    return <AccessRestricted />;
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <AlertCircle size={48} className="text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Campaign Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">The campaign you are looking for does not exist or may have been deleted.</p>
        <button onClick={() => router.push('/dashboard/campaigns')} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
          <ArrowLeft size={16} /> Back to Campaigns
        </button>
      </div>
    );
  }

  const st = statusConfig[campaign.status] || statusConfig.DRAFT;
  const assignedUsers = campaign.assignments?.filter(a => a.user).map(a => a.user!) || [];
  const assignedTeams = campaign.assignments?.filter(a => a.team).map(a => a.team!) || [];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button onClick={() => router.push('/dashboard/campaigns')} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-8 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Campaigns List
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${st.color} ${st.bg} ${st.border}`}>
              <Megaphone size={12} /> {st.label}
            </span>
          </div>
          <span className="text-sm text-zinc-400 bg-white/5 px-3 py-1 rounded-lg border border-white/5 font-semibold text-primary">
            Budget: ₹{campaign.budget.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-tight">{campaign.name}</h1>

        {/* Details List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/10 pt-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Client</p>
            <p className="text-sm font-semibold text-white">{campaign.client?.companyName || 'N/A'}</p>
          </div>

          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Timeline</p>
            <p className="text-sm font-semibold text-white">
              {new Date(campaign.startDate).toLocaleDateString()} &rarr; {new Date(campaign.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Assignments */}
        <div className="border-t border-white/10 mt-6 pt-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Assigned Access</p>
          <div className="flex flex-wrap gap-2">
            {assignedUsers.map(u => (
              <span key={u.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <UserPlus size={12} /> {u.firstName} {u.lastName}
              </span>
            ))}
            {assignedTeams.map(t => (
              <span key={t.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users size={12} /> {t.name} (Team)
              </span>
            ))}
            {assignedUsers.length === 0 && assignedTeams.length === 0 && (
              <p className="text-sm text-zinc-400 italic">No custom user or team assignments.</p>
            )}
          </div>
        </div>

        {/* Footer info / Permissions indication */}
        <div className="border-t border-white/10 mt-8 pt-6 flex items-center gap-2 text-xs text-zinc-500">
          <Shield size={14} className="text-blue-500/60" />
          <span>Access control verified. You have permission to view this campaign.</span>
        </div>
      </motion.div>
    </div>
  );
}
