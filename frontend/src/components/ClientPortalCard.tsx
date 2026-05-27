import React from 'react';
import { Calendar, Megaphone, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClientPortalCardProps {
  campaign: {
    id: string;
    name: string;
    description: string | null;
    budget: number;
    startDate: string;
    endDate: string;
    status: string;
    tasksSummary: {
      total: number;
      todo: number;
      inProgress: number;
      review: number;
      done: number;
    };
  };
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10',  label: 'Active' },
  DRAFT:     { color: 'text-slate-400',   bg: 'bg-slate-500/10',    label: 'Draft' },
  PLANNED:   { color: 'text-blue-400',    bg: 'bg-blue-500/10',     label: 'Planned' },
  COMPLETED: { color: 'text-purple-400',  bg: 'bg-purple-500/10',   label: 'Completed' },
  PAUSED:    { color: 'text-amber-400',   bg: 'bg-amber-500/10',    label: 'Paused' },
};

export default function ClientPortalCard({ campaign }: ClientPortalCardProps) {
  const { name, budget, startDate, endDate, status, tasksSummary } = campaign;

  const config = statusConfig[status] || statusConfig.DRAFT;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  // Progress calculate
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();
  let timeProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  timeProgress = Math.max(0, Math.min(timeProgress, 100));

  const completionRate = tasksSummary.total > 0 ? (tasksSummary.done / tasksSummary.total) * 100 : 0;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glassmorphism rounded-2xl p-6 border border-white/10 relative overflow-hidden shadow-xl"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color} ${config.bg} border-white/5`}>
            <Megaphone size={12} />
            {config.label}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Campaign Budget</p>
          <p className="text-lg font-bold text-white">₹{budget.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-white truncate mb-2" title={name}>
        {name}
      </h3>
      {campaign.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          {campaign.description}
        </p>
      )}

      {/* Dates */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4 bg-white/3 p-2.5 rounded-xl border border-white/5">
        <Calendar size={14} className="text-primary" />
        <span>
          {start.toLocaleDateString()} &rarr; {end.toLocaleDateString()}
        </span>
      </div>

      {/* Timeline Progress */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>Timeline Progress</span>
          <span>{timeProgress.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${timeProgress}%` }}
          />
        </div>
      </div>

      {/* Tasks Progress */}
      <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckSquare size={10} className="text-emerald-400" /> Task Completion
          </p>
          <p className="text-base font-bold text-white">
            {tasksSummary.done} <span className="text-xs text-zinc-500">/ {tasksSummary.total} done</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Status</p>
          <div className="flex gap-1.5">
            <span className="text-[10px] bg-white/5 border border-white/5 text-zinc-300 px-2 py-0.5 rounded-lg">
              {tasksSummary.inProgress} In-Progress
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
