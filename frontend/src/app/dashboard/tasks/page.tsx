'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckSquare, Clock, AlertCircle, CheckCircle2, Shield, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

interface Task {
  id: string;
  title: string;
  assignee: string | null;
  assigneeId: string | null;
  priority: Priority;
  campaign: string | null;
  campaignId: string | null;
  dueDate: string | null;
  status: TaskStatus;
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

interface CampaignOption {
  id: string;
  name: string;
}

const columns: { id: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'TODO',        label: 'To Do',       icon: CheckSquare,  color: 'text-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock,        color: 'text-blue-400' },
  { id: 'REVIEW',      label: 'Review',      icon: AlertCircle,  color: 'text-amber-400' },
  { id: 'DONE',        label: 'Done',        icon: CheckCircle2, color: 'text-emerald-400' },
];

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Low',    color: 'text-slate-400',   bg: 'bg-slate-400/10' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  HIGH:   { label: 'High',   color: 'text-red-400',     bg: 'bg-red-400/10' },
};

export default function TasksPage() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<{id: string, firstName: string, lastName: string}[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assignee: '', assigneeId: '', priority: 'MEDIUM' as Priority, campaign: '', campaignId: '', dueDate: '', status: 'TODO' as TaskStatus });
  const [loading, setLoading] = useState(true);

  // Idempotency and submit state guards
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [updatingTaskIds, setUpdatingTaskIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateIdempotencyKey = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const openCreateModal = () => {
    setIdempotencyKey(generateIdempotencyKey());
    setShowModal(true);
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTeamMembers(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch team', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchTeamMembers();
    }
    fetchCampaigns();
  }, [isAdmin]);

  // Real-time sync
  useEffect(() => {
    if (!socket) return;
    const handler = () => { fetchTasks(); };
    socket.on('task_updated', handler);
    return () => { socket.off('task_updated', handler); };
  }, [socket]);

  // Determine if current user can modify a task
  const canModifyTask = (task: Task): boolean => {
    if (isAdmin) return true;
    if (task.assigneeId === user?.id) return true;
    return false;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(newTask)
      });

      if (res.ok) {
        const created = await res.json();

        // 1. Optimistic UI Check: Avoid duplicates if already populated
        setTasks(prev => {
          if (prev.some(t => t.id === created.id)) return prev;
          return [created, ...prev];
        });

        // 2. UX Toast Feedback
        if (created._isDuplicate) {
          showToast('Task already created', 'warning');
        } else {
          showToast('Task created successfully', 'success');
        }

        setNewTask({ title: '', assignee: '', assigneeId: '', priority: 'MEDIUM', campaign: '', campaignId: '', dueDate: '', status: 'TODO' });
        setShowModal(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to create task', 'error');
      }
    } catch (error) {
      console.error('Failed to create task', error);
      showToast('Network error. Retrying will safely use the same idempotency key.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !canModifyTask(task)) return;
    if (task.status === newStatus) return;

    // Avoid parallel duplicate requests for status moves
    if (updatingTaskIds.includes(taskId)) return;

    setUpdatingTaskIds(prev => [...prev, taskId]);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const token = localStorage.getItem('adrex_token');
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error('Failed to update task status', error);
      showToast('Failed to update status. Reverting change...', 'error');
      fetchTasks();
    } finally {
      setUpdatingTaskIds(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !canModifyTask(task) || updatingTaskIds.includes(taskId)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) moveTask(taskId, status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Track work across all campaigns and team members.' : 'Your assigned tasks and campaign work.'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        >
          <Plus size={18} /> Add Task
        </button>
      </div>

      {/* Stats */}
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

      {/* RBAC Notice for non-admins */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
        >
          <Shield size={16} className="text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300">
            You are viewing tasks assigned to you or related to your campaigns. Contact an admin to modify assignments.
          </p>
        </motion.div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map((col, ci) => {
          const Icon = col.icon;
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <motion.div key={col.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}>
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon size={16} className={col.color} />
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">{colTasks.length}</span>
              </div>

              {/* Cards */}
              <div
                className="space-y-3 min-h-[300px] p-2 -mx-2 rounded-xl transition-colors hover:bg-white/5"
                onDrop={(e) => handleDrop(e, col.id)}
                onDragOver={handleDragOver}
              >
                <AnimatePresence>
                  {colTasks.map((task, ti) => {
                    const pri = priorityConfig[task.priority];
                    const canDrag = canModifyTask(task);
                    const displayName = task.assigneeUser
                      ? `${task.assigneeUser.firstName} ${task.assigneeUser.lastName}`
                      : task.assignee;
                    const campaignName = task.campaignObj?.name || task.campaign;

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: ti * 0.04 }}
                        draggable={canDrag}
                        onDragStart={(e: any) => handleDragStart(e, task.id)}
                        className={`glassmorphism rounded-xl p-4 border transition-all group shadow-sm hover:shadow-md ${
                          canDrag
                            ? 'border-border/30 hover:border-primary/50 cursor-grab active:cursor-grabbing'
                            : 'border-border/20 opacity-90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="text-sm font-medium leading-snug">{task.title}</p>
                          <div className="flex items-center gap-1.5">
                            {!canDrag && <Lock size={11} className="text-zinc-500" />}
                            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${pri.color} ${pri.bg}`}>
                              {pri.label}
                            </span>
                          </div>
                        </div>
                        {campaignName && (
                          <p className="text-xs text-muted-foreground mb-3 truncate">📁 {campaignName}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {displayName ? (
                            <span className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                                {displayName[0].toUpperCase()}
                              </div>
                              {displayName}
                            </span>
                          ) : <span />}
                          {task.dueDate && <span className="text-[11px]">📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {!loading && colTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border/30 text-muted-foreground text-sm">
                    Drop here
                  </div>
                )}
                {loading && (
                   <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border/10 text-muted-foreground text-sm animate-pulse">
                   Loading...
                 </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-md glassmorphism rounded-2xl p-8"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">New Task</h2>
                <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-50"><X size={20} /></button>
              </div>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Task Title</label>
                  <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                    type="text" placeholder="e.g. Brief influencers for campaign" required disabled={isSubmitting}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-60" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {isAdmin ? (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Assignee</label>
                      <select value={newTask.assigneeId || ''} onChange={e => {
                        const member = teamMembers.find(m => m.id === e.target.value);
                        setNewTask(p => ({ ...p, assigneeId: e.target.value, assignee: member ? `${member.firstName} ${member.lastName}` : '' }));
                      }} disabled={isSubmitting} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-60">
                        <option value="">Unassigned</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Assignee</label>
                      <input value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}
                        type="text" placeholder="Name" disabled={isSubmitting} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-60" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Priority</label>
                    <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as Priority }))}
                      disabled={isSubmitting} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-60">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Campaign (Project)</label>
                  <select value={newTask.campaignId || ''} onChange={e => {
                    const camp = campaigns.find(c => c.id === e.target.value);
                    setNewTask(p => ({ ...p, campaignId: e.target.value, campaign: camp?.name || '' }));
                  }} disabled={isSubmitting}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-60">
                    <option value="">No campaign</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Due Date</label>
                  <input value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                    type="date" disabled={isSubmitting} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-60" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Creating Task...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : toast.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
