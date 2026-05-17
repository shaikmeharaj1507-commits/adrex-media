'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, MessageSquare, Calendar, Clock, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ tasks: 0, messages: 0, events: 0, team: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.tasks.getMyTasks().catch(() => []),
      api.calendar.get().catch(() => []),
      api.team.getMembers().catch(() => []),
    ]).then(([tasks, events, team]) => {
      setStats({
        tasks: Array.isArray(tasks) ? tasks.length : 0,
        messages: 0,
        events: Array.isArray(events) ? events.length : 0,
        team: Array.isArray(team) ? team.length : 0,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    { label: 'My Tasks', value: stats.tasks, icon: CheckSquare, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-500/5' },
    { label: 'Team Members', value: stats.team, icon: Users, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5' },
    { label: 'Calendar Events', value: stats.events, icon: Calendar, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your workspace overview.</p>
      </motion.div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`p-5 rounded-2xl bg-gradient-to-br ${card.bg} border border-white/10`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{loading ? '—' : card.value}</p>
              <p className="text-sm text-zinc-400 mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="glassmorphism rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <CheckSquare size={18} className="text-purple-400" /> Recent Tasks
          </h3>
          <p className="text-sm text-zinc-500">Your assigned tasks will appear here.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="glassmorphism rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-400" /> Quick Actions
          </h3>
          <div className="space-y-3">
            {[
              { href: '/dashboard/chat', label: 'Open Team Chat', icon: MessageSquare, color: 'bg-purple-500' },
              { href: '/dashboard/tasks', label: 'View My Tasks', icon: CheckSquare, color: 'bg-blue-500' },
              { href: '/dashboard/profile', label: 'Edit Profile', icon: Clock, color: 'bg-emerald-500' },
            ].map((link, i) => {
              const Icon = link.icon;
              return (
                <a key={i} href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group">
                  <div className={`w-9 h-9 rounded-lg ${link.color} flex items-center justify-center text-white shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-white font-medium transition-colors">{link.label}</span>
                </a>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
