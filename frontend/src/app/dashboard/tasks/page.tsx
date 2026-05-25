'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

interface Task {
  id: string;
  title: string;
  assignee: string | null;
  priority: Priority;
  campaign: string | null;
  dueDate: string | null;
  status: TaskStatus;
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
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<{id: string, firstName: string, lastName: string}[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assignee: '', assigneeId: '', priority: 'MEDIUM' as Priority, campaign: '', dueDate: '', status: 'TODO' as TaskStatus });
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchTasks();
    if (isAdmin) fetchTeamMembers();
  }, [isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });
      
      if (res.ok) {
        const created = await res.json();
        setTasks(prev => [created, ...prev]);
        setNewTask({ title: '', assignee: '', assigneeId: '', priority: 'MEDIUM', campaign: '', dueDate: '', status: 'TODO' });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
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
      fetchTasks(); 
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
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
          <p className="text-muted-foreground mt-1">Track work across all campaigns and team members.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: ti * 0.04 }}
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, task.id)}
                        className="glassmorphism rounded-xl p-4 border border-border/30 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="text-sm font-medium leading-snug">{task.title}</p>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${pri.color} ${pri.bg}`}>
                            {pri.label}
                          </span>
                        </div>
                        {task.campaign && (
                          <p className="text-xs text-muted-foreground mb-3 truncate">📁 {task.campaign}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {task.assignee ? (
                            <span className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                                {task.assignee[0].toUpperCase()}
                              </div>
                              {task.assignee}
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-md glassmorphism rounded-2xl p-8"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">New Task</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Task Title</label>
                  <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                    type="text" placeholder="e.g. Brief influencers for campaign" required
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {isAdmin ? (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Assignee</label>
                      <select value={newTask.assigneeId || ''} onChange={e => {
                        const member = teamMembers.find(m => m.id === e.target.value);
                        setNewTask(p => ({ ...p, assigneeId: e.target.value, assignee: member ? `${member.firstName} ${member.lastName}` : '' }));
                      }} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
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
                        type="text" placeholder="Name" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Priority</label>
                    <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as Priority }))}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Campaign</label>
                  <input value={newTask.campaign} onChange={e => setNewTask(p => ({ ...p, campaign: e.target.value }))}
                    type="text" placeholder="Campaign name" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Due Date</label>
                  <input value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                    type="date" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  Create Task
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
