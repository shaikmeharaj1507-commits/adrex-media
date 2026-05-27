'use client';

import { use, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowLeft, CheckCircle2, AlertCircle, Clock, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AccessRestricted from '@/components/AccessRestricted';

interface Task {
  id: string;
  title: string;
  assignee: string | null;
  assigneeId: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  campaign: string | null;
  campaignId: string | null;
  dueDate: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  assigneeUser?: {
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  } | null;
  campaignObj?: {
    id: string;
    name: string;
  } | null;
}

const statusConfig = {
  TODO:        { label: 'To Do',       icon: CheckSquare,  color: 'text-slate-400',  bg: 'bg-slate-400/10', border: 'border-slate-500/20' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock,        color: 'text-blue-400',   bg: 'bg-blue-400/10',  border: 'border-blue-500/20' },
  REVIEW:      { label: 'Review',      icon: AlertCircle,  color: 'text-amber-400',  bg: 'bg-amber-400/10', border: 'border-amber-500/20' },
  DONE:        { label: 'Done',        icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/20' },
};

const priorityConfig = {
  LOW:    { label: 'Low',    color: 'text-slate-400',   bg: 'bg-slate-400/10' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  HIGH:   { label: 'High',   color: 'text-red-400',     bg: 'bg-red-400/10' },
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const token = localStorage.getItem('adrex_token');
        const res = await fetch(`${API_URL}/api/tasks/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setTask(data);
        } else {
          setError(res.status);
        }
      } catch (err) {
        console.error('Error fetching task:', err);
        setError(500);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
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

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <AlertCircle size={48} className="text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Task Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">The task you are looking for does not exist or may have been deleted.</p>
        <button onClick={() => router.push('/dashboard/tasks')} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
          <ArrowLeft size={16} /> Back to Tasks
        </button>
      </div>
    );
  }

  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const StatusIcon = status.icon;
  const displayName = task.assigneeUser ? `${task.assigneeUser.firstName} ${task.assigneeUser.lastName}` : task.assignee;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button onClick={() => router.push('/dashboard/tasks')} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-8 text-sm font-medium">
        <ArrowLeft size={16} /> Back to Tasks Board
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
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.color} ${status.bg} ${status.border}`}>
              <StatusIcon size={12} /> {status.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priority.color} ${priority.bg}`}>
              Priority: {priority.label}
            </span>
          </div>
          {task.dueDate && (
            <span className="text-sm text-zinc-400 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
              📅 Due: {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-tight">{task.title}</h1>

        {/* Details List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/10 pt-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Campaign (Project)</p>
            {task.campaignObj ? (
              <p className="text-sm font-semibold text-white">📁 {task.campaignObj.name}</p>
            ) : task.campaign ? (
              <p className="text-sm font-semibold text-white">📁 {task.campaign}</p>
            ) : (
              <p className="text-sm text-zinc-400 italic">No associated campaign</p>
            )}
          </div>

          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Assignee</p>
            {displayName ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                  {displayName[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">{displayName}</span>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 italic">Unassigned</p>
            )}
          </div>
        </div>

        {/* Footer info / Permissions indication */}
        <div className="border-t border-white/10 mt-8 pt-6 flex items-center gap-2 text-xs text-zinc-500">
          <Shield size={14} className="text-blue-500/60" />
          <span>Access control verified. You have permission to view this task.</span>
        </div>
      </motion.div>
    </div>
  );
}
