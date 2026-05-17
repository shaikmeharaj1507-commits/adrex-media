'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

interface Task {
  id: string;
  title: string;
  assignee: string | null;
  priority: string;
  campaign: string | null;
  dueDate: string | null;
  status: TaskStatus;
}

const columns: { id: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'TODO', label: 'To Do', icon: CheckSquare, color: 'text-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'text-blue-400' },
  { id: 'REVIEW', label: 'Review', icon: AlertCircle, color: 'text-amber-400' },
  { id: 'DONE', label: 'Done', icon: CheckCircle2, color: 'text-emerald-400' },
];

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-400/10' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  HIGH: { label: 'High', color: 'text-red-400', bg: 'bg-red-400/10' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);

  useEffect(() => {
    api.tasks.getMyTasks().then(data => {
      if (Array.isArray(data)) setTasks(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    setMoving(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.tasks.updateStatus(taskId, newStatus);
    } catch (error) {
      console.error('Failed to update task', error);
    } finally {
      setMoving(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground mt-1">Track and manage your assigned work.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {columns.map((col, i) => {
          const Icon = col.icon;
          const count = tasks.filter(t => t.status === col.id).length;
          return (
            <motion.div key={col.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="p-4 rounded-xl glassmorphism flex items-center gap-3">
              <Icon size={20} className={col.color} />
              <div>
                <p className="text-xs text-muted-foreground">{col.label}</p>
                <p className="text-2xl font-bold">{loading ? '-' : count}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map((col, ci) => {
          const Icon = col.icon;
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <motion.div key={col.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon size={16} className={col.color} />
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">{colTasks.length}</span>
              </div>

              <div className="space-y-3 min-h-[200px] p-2 -mx-2 rounded-xl">
                {colTasks.map((task, ti) => {
                  const pri = priorityConfig[task.priority] || priorityConfig.MEDIUM;
                  const nextStatus = col.id === 'TODO' ? 'IN_PROGRESS' : col.id === 'IN_PROGRESS' ? 'REVIEW' : col.id === 'REVIEW' ? 'DONE' : null;
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: ti * 0.04 }}
                      className="glassmorphism rounded-xl p-4 border border-border/30 hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="text-sm font-medium leading-snug">{task.title}</p>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${pri.color} ${pri.bg}`}>
                          {pri.label}
                        </span>
                      </div>
                      {task.campaign && <p className="text-xs text-muted-foreground mb-3 truncate">{task.campaign}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString()}</span>}
                        {nextStatus && (
                          <button
                            onClick={() => moveTask(task.id, nextStatus)}
                            disabled={moving === task.id}
                            className="px-2 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-all disabled:opacity-50"
                          >
                            {moving === task.id ? <Loader2 size={12} className="animate-spin" /> : `Move to ${columns.find(c => c.id === nextStatus)?.label}`}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {colTasks.length === 0 && !loading && (
                  <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border/30 text-muted-foreground text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
