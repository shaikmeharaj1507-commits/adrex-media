'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ExternalLink, Loader2, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  monthlyBudget: number | null;
  status: string;
}

export default function ClientPortalSelectorPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('adrex_token');
        const res = await fetch(`${API_URL}/api/clients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setClients(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <Users size={18} className="text-white" />
          </span>
          Client Portal Previews
        </h1>
        <p className="text-zinc-400 mt-1 ml-12">
          Generate, preview, and share live client dashboard links. Only campaigns and invoices linked to the client will be visible.
        </p>
      </div>

      {/* Info Warning */}
      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-2xl flex items-start gap-3 ml-12">
        <ShieldCheck size={20} className="shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-semibold text-white">Security Checkpoint:</span> Client dashboards are strictly **read-only**. Brand clients can view budgets, active timeline status, and download deliverables, but cannot edit, delete, or perform modifications.
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative ml-12">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input
          type="text"
          placeholder="Search brand clients by company name or contact..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      {/* Client List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center ml-12">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center ml-12">
          <Users className="text-zinc-600 mx-auto mb-3" size={32} />
          <h3 className="text-lg font-medium text-white mb-1">No clients found</h3>
          <p className="text-zinc-400 text-sm">Please check your query or create a brand client first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
          {filteredClients.map((client) => (
            <motion.div
              key={client.id}
              whileHover={{ y: -2 }}
              onClick={() => router.push(`/dashboard/client-portal/${client.id}`)}
              className="bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 cursor-pointer flex justify-between items-center group transition-all"
            >
              <div>
                <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                  {client.companyName}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Contact: {client.contactName} • {client.email}
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">
                    Status: {client.status}
                  </span>
                  {client.monthlyBudget && (
                    <span className="text-[10px] bg-purple-500/10 px-2 py-0.5 rounded text-purple-400 font-semibold">
                      Budget: ₹{client.monthlyBudget.toLocaleString('en-IN')}/mo
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
